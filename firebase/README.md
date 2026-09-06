# Firebase — configuração do Açaí da Bea

Este diretório guarda somente arquivos de referência para configuração manual no Firebase Console.

## Firestore Rules

Copie o conteúdo de `firebase/firestore.rules` para:

Firebase Console → Firestore Database → Rules → Publish.

As regras esperam:

- `admins/{UID}.active == true`
- `admins/{UID}.role` igual a `owner` ou `admin`
- `admins/{UID}.storeId == "acai-da-bea"`
- todos os documentos de `products`, `optionGroups` e `options` com `storeId: "acai-da-bea"`

O documento público da loja deve ser `stores/acai-da-bea`.

## Authentication

Em Authentication → Sign-in method, mantenha Email/Password habilitado.

Em Authentication → Settings → Authorized domains, confirme:

- `charlysonfernades.github.io`
- `localhost` para testes locais

## Configuração Web

O arquivo `js/firebase-config.js` precisa receber o objeto `firebaseConfig` exato do app Web criado no Firebase Console. Não coloque senhas de usuário nesse arquivo.
