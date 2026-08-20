import { getAccessToken } from './googleAuth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
  starred?: boolean;
  owners?: Array<{ displayName: string; photoLink?: string; emailAddress: string }>;
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * Fetches files and folders from Google Drive
 */
export async function listDriveFiles(
  folderId: string = 'root',
  queryStr: string = '',
  pageToken?: string
): Promise<DriveListResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  let q = `'${folderId}' in parents and trashed = false`;
  if (queryStr.trim()) {
    q += ` and name contains '${queryStr.replace(/'/g, "\\'")}'`;
  }

  const fields = 'nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,webContentLink,webViewLink,size,modifiedTime,starred,owners)';
  const params = new URLSearchParams({
    q,
    fields,
    pageSize: '40',
    orderBy: 'folder,modifiedTime desc',
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch files from Drive (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * Uploads a file to Google Drive using multipart upload
 */
export async function uploadDriveFile(
  file: File,
  folderId: string = 'root'
): Promise<DriveFile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,iconLink,thumbnailLink,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Google Drive (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * Creates a new folder in Google Drive
 */
export async function createDriveFolder(
  folderName: string,
  parentId: string = 'root'
): Promise<DriveFile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder in Drive (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * Moves a file to trash in Google Drive (Destructive operation)
 */
export async function trashDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to move file to trash (Status ${res.status})`);
  }
}

/**
 * Reads plain text content of a file (e.g. text/plain, Markdown, or exported Google Doc)
 */
export async function readDriveFileContent(file: DriveFile): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

  // If it's a Google Doc, export as plain text
  if (file.mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to read file content (Status ${res.status})`);
  }

  return await res.text();
}

/**
 * Downloads image file from Google Drive as a Data URL to use in AI Teacher UI
 */
export async function getDriveImageAsDataUrl(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch image from Google Drive');
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
