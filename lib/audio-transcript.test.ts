import {
  audioMediaTypeFor,
  isAudioFilename,
  isSupportedAudioMediaType,
} from "./audio-transcript";

describe("audioMediaTypeFor", () => {
  it("déduit le type de l'extension avant le type annoncé par le navigateur", () => {
    expect(audioMediaTypeFor("rdv.m4a", "audio/x-m4a")).toBe("audio/mp4");
    expect(audioMediaTypeFor("RDV.MP3", "")).toBe("audio/mpeg");
    expect(audioMediaTypeFor("note.opus", "")).toBe("audio/ogg");
  });

  it("garde un type audio annoncé quand l'extension est inconnue", () => {
    expect(audioMediaTypeFor("enregistrement", "audio/x-caf")).toBe(
      "audio/x-caf",
    );
  });

  it("retombe sur mpeg quand rien n'est exploitable", () => {
    expect(
      audioMediaTypeFor("enregistrement", "application/octet-stream"),
    ).toBe("audio/mpeg");
  });
});

describe("isAudioFilename", () => {
  it("reconnaît les extensions audio et rien d'autre", () => {
    expect(isAudioFilename("rdv.wav")).toBe(true);
    expect(isAudioFilename("rdv.docx")).toBe(false);
  });
});

describe("isSupportedAudioMediaType", () => {
  it("n'accepte que des types audio", () => {
    expect(isSupportedAudioMediaType("audio/mp4")).toBe(true);
    expect(isSupportedAudioMediaType("video/mp4")).toBe(false);
  });
});
