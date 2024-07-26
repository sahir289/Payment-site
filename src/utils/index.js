import { message } from "antd";
export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            message.success('Copied to clipboard');
        }).catch(() => {
            message.error('Failed to copy');
        });
};



