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

## Cadastro e edição

O painel possui fluxos para criar os dados iniciais quando as collections estão vazias e depois editar os registros existentes. O cadastro inicial não deve ser usado para substituir um catálogo já preenchido.

Antes de uma entrega para produção, confirme no painel:

- dados da loja e contatos;
- produtos e preços;
- disponibilidade;
- grupos e opções de personalização;
- status do delivery;
- acesso do administrador autorizado.
