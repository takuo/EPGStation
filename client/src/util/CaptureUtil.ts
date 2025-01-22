import RuleApiModel from '@/model/api/rule/RuleApiModel';
import DateUtil from './DateUtil';
import Util from './Util';
import * as apid from '../../../api';
import stringify from 'json-stable-stringify';

namespace CaptureUtil {
    export interface CaptureInfo {
        dataUrl: string;
        position: number;
        title?: string;
        width: number;
        height: number;
        method: string;
    }

    export interface Result {
        error: boolean;
        text: string;
        color?: string;
    }

    export const getStamp = (): string => {
        return DateUtil.getJaDate(new Date())
            .toISOString()
            .replace(/([-:Z]|\.[0-9]{3})/g, '');
    };

    export const copyToClipboard = async (dataUrl: string): Promise<boolean> => {
        const blob = await fetch(dataUrl).then((r: Response) => r.blob());
        if (blob !== null) {
            try {
                const item = { [blob.type]: blob } as unknown as Record<string, ClipboardItemData>;
                const clipboardItem = new ClipboardItem(item);
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } catch (error) {
                console.error(error);
            }
        }
        return false;
    };

    export const download = (data: CaptureInfo): void => {
        const link = document.createElement('a');
        if (data.position === undefined || data.position === 0) {
            link.download = `${data.title}-${getStamp()}.png`;
        } else {
            link.download = `${data.title}-t${Number.parseInt(data.position.toString(), 10)}.png`;
        }
        link.href = data.dataUrl;
        link.click();
    };

    export const upload = async (uploader: apid.ImageUploaderInfo, data: CaptureInfo): Promise<string> => {
        const blob = await fetch(data.dataUrl).then((r: Response) => r.blob());
        const formKey = uploader.formKey === undefined ? 'file' : uploader.formKey;
        const formData = new FormData();
        let filename = '';
        if (data.position == 0) {
            filename = `${data.title}-${getStamp()}.png`;
        } else {
            filename = `${data.title}-t${Number.parseInt(data.position.toString(), 10)}.png`;
        }
        formData.append(formKey, blob, filename);
        try {
            const options = {
                method: 'POST',
                body: formData,
                headers: new Headers(),
            };
            if (uploader.token) {
                options.headers.set('Authorization', `Bearer ${uploader.token}`);
            }
            const response = await fetch(uploader.url, options);
            if (response.ok) {
                const url = await response.text();
                const item = { 'text/plain': url } as unknown as Record<string, ClipboardItemData>;
                const clipboardItem = new ClipboardItem(item);
                await navigator.clipboard.write([clipboardItem]);
                return url;
            } else {
                console.error('Upload failed:', response.statusText);
            }
        } catch (error) {
            console.error(error);
        }
        return '';
    };

    export const onCapture = async (data: CaptureInfo, uploader: apid.ImageUploaderInfo | null): Promise<Result> => {
        if (data.title === '') {
            data.title = 'タイトル未設定';
        }
        if (data.method === 'upload') {
            if (uploader === null) {
                download(data); // failsafe: save to local
                return { error: false, color: 'success', text: 'キャプチャ画像をダウンロードしました。' };
            }
            const url = await upload(uploader, data);
            if (url) {
                const w = data.width || 1280;
                const h = data.height || 720;
                const x = window.screenX + window.innerWidth / 2 - w / 2;
                const y = window.screenY + window.innerHeight / 2 - h / 2;
                window.open(url, '_blank', `noopener,noreferrer,popup,top=${y},left=${x},width=${w},height=${h}`);
                return {
                    error: false,
                    color: 'success',
                    text: 'キャプチャURLをクリップボードにコピーしました。',
                };
            }
        } else if (data.method === 'clipboard') {
            if (await copyToClipboard(data.dataUrl)) {
                return {
                    error: false,
                    color: 'success',
                    text: 'キャプチャをクリップボードにコピーしました。',
                };
            }
        }
        return { error: true, text: '不明なメソッドです。', color: 'error' };
    };
}

export default CaptureUtil;
