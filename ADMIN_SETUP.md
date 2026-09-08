# Açaí da Bea — configuração administrativa

## URLs na `main`

- Cliente: `https://charlysonfernades.github.io/acai-da-bea/`
- Administração: `https://charlysonfernades.github.io/acai-da-bea/admin/`

O painel não possui link público no site do cliente. Conhecer a URL não concede acesso: a autorização depende do Firebase Authentication e das Firestore Rules publicadas no projeto.

## Configuração do Firebase

1. Confira `js/firebase-config.js` na branch `main` e mantenha nele somente a configuração pública do app Web do Firebase.
2. Em Firebase Authentication, mantenha o método de login usado pelo painel habilitado.
3. Em **Authorized domains**, confirme o domínio utilizado pelo site e `localhost` quando for necessário testar localmente.
4. Cada administrador autorizado deve possuir um documento `admins/{UID}` compatível com as regras do projeto, incluindo `active`, `role` e `storeId`.
5. O documento `stores/acai-da-bea` guarda os dados comerciais da loja. `deliveryEnabled: false` mantém a opção de entrega escondida.

Não coloque senha, chave privada ou arquivo de conta de serviço no repositório.

## Collections usadas

- `stores`
- `products`
- `optionGroups`
- `options`
- `admins`

Produtos, grupos e opções pertencentes à loja devem manter o `storeId` esperado pelas Firestore Rules.

## Produtos

O painel permite:

- alterar preço, preço antigo, categoria, descrição, imagem e ordem;
- marcar como `Disponível` ou `Esgotado`;
- manter `No cardápio` ou colocar como `Oculto`;
- escolher quais grupos de personalização o produto usa;
- definir mínimo e máximo de escolhas por grupo.

`Esgotado` mantém o produto visível para o cliente, mas impede a compra. `Oculto` remove o produto do cardápio público sem apagar o documento.

## Personalizações

- **Grupo** é uma categoria de escolhas, como Açaí e cremes, Adicionais ou Coberturas.
- **Opção** é uma escolha dentro do grupo, como Banana ou Creme de Ninho.
- Opções podem ter valor adicional e disponibilidade própria.
- As regras de mínimo/máximo pertencem ao produto, porque produtos diferentes podem permitir quantidades diferentes do mesmo grupo.

## Cadastro inicial e cardápio oficial

O painel possui fluxos para criar dados iniciais quando as collections estão vazias. Eles não devem ser usados para substituir um catálogo já preenchido.

Antes de cadastrar o cardápio oficial, leia `docs/IMPLANTACAO_CARDAPIO_OFICIAL.md`. Não faça uma migração parcial em horário de movimento sem ter a lista completa de grupos e opções preparada.

## Firestore Rules

O arquivo versionado é `firebase/firestore.rules`.

Alterar esse arquivo no GitHub **não publica automaticamente** as regras no Firebase. Quando houver mudança:

1. execute `npm run verify`;
2. revise o diff das Rules;
3. publique manualmente no Firebase Console;
4. teste uma leitura pública;
5. teste uma alteração administrativa autorizada;
6. teste uma operação que deve continuar bloqueada.

## Verificação antes de produção

Execute:

```bash
npm run verify
```

Depois confirme no painel e no site:

- dados da loja e contatos;
- produtos e preços;
- disponibilidade;
- visibilidade no cardápio;
- grupos e opções de personalização;
- limites mínimo/máximo;
- status do delivery;
- acesso do administrador autorizado;
- pedido completo até o WhatsApp.

Veja também `SECURITY.md` e `docs/CONTINUIDADE.md`.
