import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER y EMAIL_PASS deben configurarse en el .env para enviar correos");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
};

export const sendResetPasswordEmail = async ({ to, token, username = "usuario" }) => {
  const transporter = getTransporter();
  const appName = process.env.APP_NAME || "Sistema de Monitoreo de Tráfico";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl.replace(/\/$/, "")}/recover-password?token=${encodeURIComponent(token)}`;

  await transporter.verify();

  await transporter.sendMail({
    from: `"${appName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Código para restablecer tu contraseña",
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;">
        <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">
          <div style="background:#008080;padding:24px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:24px;">${appName}</h1>
          </div>
          <div style="padding:28px;color:#1f2937;">
            <h2 style="margin-top:0;">Restablecimiento de contraseña</h2>
            <p>Hola ${username}, recibimos una solicitud para cambiar tu contraseña.</p>
            <p>Usa el siguiente código en la pantalla de recuperación:</p>
            <div style="font-size:24px;font-weight:800;letter-spacing:2px;text-align:center;color:#008080;background:#eefafa;border-radius:12px;padding:16px;margin:20px 0;">
              ${token}
            </div>
            <p>También puedes abrir este enlace:</p>
            <p><a href="${resetUrl}" style="display:inline-block;background:#008080;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;">Restablecer contraseña</a></p>
            <p>Este código vence en 30 minutos.</p>
            <p style="color:#6b7280;">Si no solicitaste este cambio, ignora este correo.</p>
          </div>
        </div>
      </div>
    `,
  });
};
