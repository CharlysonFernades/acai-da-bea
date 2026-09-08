# Açaí da Bea — cardápio digital

Sistema web do **Açaí da Bea** com cardápio público, personalização de produtos, carrinho, finalização pelo WhatsApp e painel administrativo protegido por Firebase Authentication + Firestore Rules.

## URLs

- Cliente: `https://charlysonfernandes.github.io/acai-da-bea/`
- Administração: `https://charlysonfernandes.github.io/acai-da-bea/admin/`

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
- produtos, preços, descrições, imagens e ordem;
- disponibilidade (`Disponível/Esgotado`);
- exibição no cardápio (`No cardápio/Oculto`);
- grupos de personalização;
- opções, valores adicionais e disponibilidade;
- mínimo e máximo de escolhas por grupo em cada produto.

Os dados comerciais devem ser alterados pelo painel/Firestore, e não diretamente no código do site público.

## Estrutura principal

```text
acai-da-bea/
├── index.html
├── admin/
├── assets/
│   └── images/
├── css/
├── docs/
├── firebase/
├── js/
│   ├── app.js
│   ├── catalog-read-plan.js
│   ├── firebase-config.js
│   ├── order-utils.js
│   └── store-service.js
└── tests/
```

## Desenvolvimento local

Para visualizar o site localmente, sirva a pasta por HTTP. Exemplos:

```bash
python3 -m http.server 8000
```

ou use a extensão **Live Server** no VS Code.

O Firebase deve manter `localhost` autorizado quando for necessário testar login local.

## Verificação

O projeto usa Node.js 20 ou superior.

Verificação de sintaxe:

```bash
npm run check
```

Testes automatizados:

```bash
npm test
```

Verificação completa antes de considerar uma alteração pronta:

```bash
npm run verify
```

O GitHub Actions executa a mesma verificação automaticamente em pushes e pull requests.

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

O arquivo `firebase/firestore.rules` é a referência versionada das Rules, mas a publicação no Firebase Console é separada do deploy do GitHub Pages.

## Documentação importante

- `ADMIN_SETUP.md` — configuração administrativa e Firebase.
- `admin/USO_DA_DONA.md` — rotina simples do painel.
- `SECURITY.md` — princípios de segurança e resposta a incidentes.
- `docs/CONTINUIDADE.md` — como continuar, testar e recuperar o projeto com segurança.
- `docs/IMPLANTACAO_CARDAPIO_OFICIAL.md` — procedimento para substituir os dados demonstrativos pelo cardápio real.

Antes de uma implantação oficial, leia principalmente os dois arquivos em `docs/` e execute `npm run verify`.
