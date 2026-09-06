# Açaí da Bea — cardápio digital

Sistema web do **Açaí da Bea** com cardápio público, personalização de produtos, carrinho, finalização pelo WhatsApp e painel administrativo protegido por Firebase Authentication + Firestore Rules.

## URLs

- Cliente: `https://charlysonfernades.github.io/acai-da-bea/`
- Administração: `https://charlysonfernades.github.io/acai-da-bea/admin/`

O site público não possui link para o painel administrativo.

## Como funciona

1. O cliente acessa o cardápio e recebe os dados atuais da loja pelo Firestore.
2. Escolhe um produto e monta as personalizações permitidas.
3. O carrinho fica salvo no navegador do próprio cliente.
4. Antes de liberar o WhatsApp, o sistema confere novamente os dados que podem alterar aquele pedido.
5. O WhatsApp abre com a mensagem pronta para revisão e envio pelo cliente.

A finalização não grava pedidos no Firestore.

## Painel administrativo

Pelo `/admin/`, um administrador autorizado pode gerenciar:

- dados da loja, WhatsApp, Instagram, endereço e horário;
- ativação/desativação do delivery;
- produtos, preços, descrições, imagens e disponibilidade;
- grupos de personalização;
- opções e valores adicionais.

Os dados comerciais devem ser alterados pelo painel/Firestore, e não diretamente no código do site público.

## Estrutura principal

```text
acai-da-bea/
├── index.html
├── admin/
├── assets/
│   └── images/
├── css/
├── js/
│   ├── app.js
│   ├── catalog-read-plan.js
│   ├── firebase-config.js
│   ├── order-utils.js
│   └── store-service.js
└── tests/
```

## Desenvolvimento local

Para visualizar o site localmente, sirva a pasta por HTTP. Exemplo com a extensão **Live Server** no VS Code.

Para executar os testes automatizados:

```bash
npm test
```

O projeto usa Node.js 20 ou superior para a suíte de testes.

## Firebase

O projeto usa:

- Firebase Authentication para acesso administrativo;
- Cloud Firestore para loja, produtos, grupos e opções.

Collections usadas pelo catálogo:

- `stores`
- `products`
- `optionGroups`
- `options`
- `admins` para autorização do painel.

Veja `ADMIN_SETUP.md` para os pontos de configuração e `admin/USO_DA_DONA.md` para a rotina de uso do painel.
