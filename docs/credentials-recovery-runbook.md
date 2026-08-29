# BaziGB Credentials Recovery Runbook

**Version:** 1.0.0
**Date:** 2026-08-28
**Status:** Empty KeePassXC vault and external backup verified; real credential transfer pending separate approval

## Selected storage model

- Human source of truth: the local KeePassXC database `BaziGB-Credentials-v2.kdbx`.
- Dedicated groups: `Production Server`, `Application Secrets`, `Domain and DNS`, `Providers`, `Recovery`, and `Archived Credentials`.
- Primary encrypted file: stored on the human-approved MacBook with FileVault enabled.
- Verified external copy: `SP PHD U3/BaziGB Backup/Credentials/BaziGB-Credentials-v2-2026-08-29.kdbx`.
- Runtime credentials: minimum required copies remain outside application release directories on the server.

No secret value belongs in this document, Git, chat, screenshots, logs, task trackers, or the metadata inventory.

## Human setup checklist

Human Direction performs or directly observes these steps:

1. Keep FileVault enabled on the MacBook.
2. Open only the verified KeePassXC database and confirm its groups before adding values.
3. Keep the master passphrase outside the vault in the human-approved physical recovery location.
4. Create one entry per inventory item using the exact `displayName` in `ops/secrets-inventory.json`.
5. Store the value only in the protected password field or encrypted attachment. Do not duplicate it in Notes.
6. Notes may contain owner, purpose, environment, creation date, last rotation date, and recovery instructions that reveal no secret.
7. After an approved value change, save, lock, reopen, and create a new dated external copy with a matching checksum.

## File-based material

Private key files, exports, certificates, or other file-based recovery material are not copied into Git or ordinary folders. Small sensitive files may be stored as encrypted KeePassXC attachments. Large backups require a separate encrypted package. They must:

- be encrypted before it is considered stored;
- use a name that does not reveal credential values;
- contain a manifest and checksums, not plaintext documentation of passwords;
- remain on the approved MacBook for the current phase;
- have a separately protected recovery method;
- be opened only during an approved recovery test or incident.

The KeePassXC file is the selected small-secret container. The external backup path is recorded only after its checksum matched the primary file. A large encrypted database-backup container remains a later decision.

## Naming standard

Every KeePassXC item starts with `BaziGB —` and lives in one of the approved groups. Canonical names are maintained in `ops/secrets-inventory.json`.

## Recovery test

A safe recovery test proves that the authorized human can locate the primary KeePassXC file, unlock it manually, identify the required group, locate the external encrypted copy, and verify matching checksums. It must not print, screenshot, paste into chat, or commit any value.

Testing server access, rotating a credential, restoring a database, or opening the encrypted file package requires a separate approval naming the exact action.

## Loss scenarios

| Scenario | Recovery route | Remaining risk |
| --- | --- | --- |
| One application password is forgotten | KeePassXC vault | Master passphrase and healthy vault copy must remain available |
| MacBook is lost | External encrypted KDBX copy | The external drive and master passphrase must remain separately available |
| Master passphrase is lost | Physical recovery record | No central password reset exists |
| Server runtime secret is lost | Human source of truth, then approved runtime restoration | Service interruption until controlled restoration |
| File-based key is lost | Encrypted recovery package | Single-device loss risk remains temporarily accepted |

## Evidence states

- `DESIGNED`: this document and metadata inventory exist.
- `HUMAN SETUP COMPLETE`: the KeePassXC vault reopens manually and the approved groups exist.
- `VALUES TRANSFERRED`: real values were moved under separate approval.
- `FILE PACKAGE VERIFIED`: the encrypted package was created and its manifest checked under separate approval.
- `RECOVERY PROVEN`: an approved recovery test succeeded.

The first two states and an empty-vault external checksum match are currently established. No real credential value has been transferred.
