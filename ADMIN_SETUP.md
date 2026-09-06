# Açaí da Bea — painel administrativo

## URLs depois de publicar na `main`

- Cliente: `https://charlysonfernades.github.io/acai-da-bea/`
- Administração: `https://charlysonfernades.github.io/acai-da-bea/admin/`

O painel é separado visualmente e não possui link público no site do cliente. Conhecer a URL não dá acesso: o login e as Firestore Rules controlam a autorização.

## Manual obrigatório antes do teste

1. Abra `js/firebase-config.js` na branch `painel-admin-v2`.
2. Em Firebase Console → Configurações do projeto → Seus apps → Açaí da Bea - Web, copie o objeto `firebaseConfig`.
3. Substitua o objeto do arquivo pelo objeto exato do Firebase, principalmente o `apiKey`.
4. Em Authentication → Settings → Authorized domains, confirme `charlysonfernades.github.io` e, para teste local, `localhost`.
5. Confirme `admins/{UID}` com `active: true`, `role: "owner"` e `storeId: "acai-da-bea"`.
6. Confirme `stores/acai-da-bea` com os campos comerciais. `deliveryEnabled: false` esconde Delivery.

## Collections que o painel usa

- `products`
- `optionGroups`
- `options`

O painel tem botões para criar os dados iniciais dessas coleções.
