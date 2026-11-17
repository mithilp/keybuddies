// Studio codes have been six digits since the first studio. Anything else in
// the address can't be a studio, and firestore isn't asked about it.
export const isStudioCode = (code: string) => /^\d{6}$/.test(code);
