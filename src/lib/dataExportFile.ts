import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ExportDeliveryResult = 'completed' | 'cancelled';
export type ExportDeliveryPhase = 'file' | 'share';

export class ExportFileError extends Error {}

function buildExportFileName(): string {
  return `solapath-data-export-${new Date().toISOString().slice(0, 10)}.json`;
}

export async function deliverDataExport(
  data: Record<string, unknown>,
  onPhase: (phase: ExportDeliveryPhase) => void,
): Promise<ExportDeliveryResult> {
  const fileName = buildExportFileName();
  const json = JSON.stringify(data, null, 2);

  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return 'completed';
  }

  onPhase('file');
  let fileUri: string;
  try {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    fileUri = written.uri;
    await Filesystem.stat({ path: fileName, directory: Directory.Cache });
  } catch {
    throw new ExportFileError('We could not prepare the file on this device. Please try again.');
  }

  onPhase('share');
  try {
    await Share.share({
      title: 'SOLAPATH data export',
      files: [fileUri],
      dialogTitle: 'Save your SOLAPATH data',
    });
    return 'completed';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(message)) return 'cancelled';
    throw new ExportFileError('We could not open the share sheet. Please try again.');
  }
}
