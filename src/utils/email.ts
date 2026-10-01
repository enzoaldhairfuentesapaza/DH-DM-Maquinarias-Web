/**
 * Abre un borrador de Gmail en una pestaña nueva con el destinatario, asunto
 * y cuerpo ya rellenados. Se usa en vez de "mailto:" porque mailto depende de
 * tener un programa de correo de escritorio configurado (Outlook, Mail, etc.)
 * y en la mayoría de computadoras no hay ninguno, así que el enlace no hacía
 * nada. Gmail en el navegador siempre funciona, con o sin sesión iniciada
 * (si no hay sesión, Google pide iniciarla y luego abre el borrador).
 */
export function abrirGmailCompose(opts: { to: string; subject?: string; body?: string }) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: opts.to,
  });
  if (opts.subject) params.set("su", opts.subject);
  if (opts.body) params.set("body", opts.body);
  const url = `https://mail.google.com/mail/?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Panel de administración (Webuzo): la bandeja de correo del negocio vive en
 * el webmail del hosting, no en Gmail. Abrimos esa bandeja en una pestaña
 * nueva y copiamos el mensaje ya armado al portapapeles, porque el webmail
 * de Webuzo no admite rellenar el "Nuevo mensaje" desde una URL externa.
 */
export const WEBMAIL_PANEL_URL = "https://dh-dm-maquinarias.com:2003/sessnd8m1gaFmuNX5Tnd/mail/";

export async function abrirWebmailPanel(mensaje: string): Promise<boolean> {
  window.open(WEBMAIL_PANEL_URL, "_blank", "noopener,noreferrer");
  try {
    await navigator.clipboard.writeText(mensaje);
    return true;
  } catch {
    return false;
  }
}
