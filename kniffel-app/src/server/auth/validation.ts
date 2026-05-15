export type RegisterInput = {
  email: string;
  password: string;
  passwordRepeat: string;
  username: string;
};

export type LoginInput = {
  login: string;
  password: string;
};

type ValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_-]{3,32}$/;

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export function validateRegisterForm(formData: FormData): ValidationResult<RegisterInput> {
  const username = readString(formData, "username").toLowerCase();
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const passwordRepeat = readString(formData, "passwordRepeat");

  if (!usernamePattern.test(username)) {
    return {
      error: "Username muss 3 bis 32 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ und - enthalten.",
      ok: false
    };
  }

  if (!emailPattern.test(email)) {
    return { error: "Bitte gib eine gueltige E-Mail-Adresse ein.", ok: false };
  }

  if (password.length < 8) {
    return { error: "Passwort muss mindestens 8 Zeichen lang sein.", ok: false };
  }

  if (password !== passwordRepeat) {
    return { error: "Die Passwoerter stimmen nicht ueberein.", ok: false };
  }

  return { data: { email, password, passwordRepeat, username }, ok: true };
}

export function validateLoginForm(formData: FormData): ValidationResult<LoginInput> {
  const login = readString(formData, "login");
  const password = readString(formData, "password");

  if (!login) {
    return { error: "Bitte Username oder E-Mail eingeben.", ok: false };
  }

  if (!password) {
    return { error: "Bitte Passwort eingeben.", ok: false };
  }

  return { data: { login, password }, ok: true };
}
