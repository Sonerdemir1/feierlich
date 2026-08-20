import QRCode from "qrcode";

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#211C19", light: "#FAF6EF" } });
}

export async function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: "png", margin: 1, width: 512, color: { dark: "#211C19", light: "#FAF6EF" } });
}
