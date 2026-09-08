# Continuidade técnica do projeto

Este documento existe para permitir que o projeto continue com segurança mesmo quando outra pessoa, outro computador ou outro assistente precisar entender o sistema sem reconstruir todo o histórico.

## Regra principal

A `main` representa a versão considerada estável. Antes de qualquer alteração:

1. confirme o commit atual da `main`;
2. crie uma branch separada;
3. altere somente o necessário;
4. execute `npm run verify`;
5. teste o fluxo afetado em servidor local;
6. só depois atualize a `main`.

Evite mudanças grandes misturadas com correções pequenas.

## Arquivos que formam o núcleo

- `index.html`: estrutura da página pública.
- `js/app.js`: interface do cliente, carrinho e fluxo de checkout.
- `js/order-utils.js`: regras compartilhadas de preço, personalização, segurança de texto/URL e reconciliação do pedido.
- `js/store-service.js`: leitura em tempo real e conferência atual do catálogo.
- `js/catalog-read-plan.js`: decide quais documentos precisam ser relidos no checkout.
- `js/firebase-config.js`: configuração pública do app Web e `STORE_ID`.
- `admin/index.html`: interface do painel administrativo.
- `admin/admin.js`: autenticação do painel e operações administrativas.
- `firebase/firestore.rules`: autorização e validação do Firestore.
- `tests/`: proteção automatizada contra regressões.

## Invariantes que não devem ser quebradas

### Segurança

- Conhecer `/admin/` nunca deve conceder acesso.
- `admins/{UID}` não pode ser criado ou alterado pelo navegador.
- Somente administrador ativo da loja correta pode gravar dados comerciais.
- Não adicionar senhas, chaves privadas ou contas de serviço ao repositório.
- Manter `deny-all` para caminhos não previstos no Firestore.

### Pedido

- O preço salvo no navegador nunca é autoridade final.
- Antes do WhatsApp, o catálogo atual deve ser conferido novamente.
- Produto esgotado ou oculto não pode continuar sendo vendido.
- Opção indisponível deve invalidar/revisar o item quando necessário.
- Mínimo e máximo de personalizações devem ser validados além da interface visual.
- O carrinho deve ser preservado até o cliente decidir começar um novo pedido.

### Painel

- `Disponível/Esgotado` e `No cardápio/Oculto` são funções diferentes.
- Alterar um produto não deve mudar o `storeId`.
- Cadastro inicial nunca deve sobrescrever coleções já preenchidas.
- Novas funções administrativas devem continuar protegidas pelas Firestore Rules, não apenas por botões escondidos.

## Verificação local

Com Node.js 20 ou superior:

```bash
npm run verify
```

Para abrir localmente:

```bash
python3 -m http.server 8000
```

Depois acesse:

- cliente: `http://localhost:8000/`
- painel: `http://localhost:8000/admin/`

O Firebase precisa aceitar `localhost` como domínio autorizado para testes de autenticação.

## Checklist depois de uma mudança

- `npm run verify` passou.
- página pública abre sem erro de sintaxe.
- painel abre e login continua protegido.
- produto pode ser montado respeitando mínimo/máximo.
- carrinho soma preços corretamente.
- alteração de preço/estoque é percebida antes do WhatsApp.
- produto oculto não aparece para o cliente.
- mensagem do WhatsApp contém item, quantidade, escolhas e total corretos.
- nenhuma senha ou chave privada foi adicionada.

## Como voltar atrás

Prefira reverter o commit problemático em vez de apagar histórico.

No Git:

```bash
git log --oneline
# identifique o commit problemático
git revert <SHA_DO_COMMIT>
git push
```

Depois aguarde a publicação do GitHub Pages e teste novamente.

Não use `git push --force` na `main` como procedimento normal de recuperação.

## Firebase e GitHub são publicações diferentes

Atualizar a `main` publica o site pelo GitHub Pages, mas não publica automaticamente `firebase/firestore.rules`.

Quando as Rules mudarem, elas precisam ser publicadas separadamente no Firebase Console e testadas. Nunca diga que uma mudança de Rules está em produção apenas porque o GitHub Pages terminou o deploy.

## Antes de pedir ajuda a outro assistente

Forneça ou indique:

- repositório e branch atual;
- commit atual da `main`;
- arquivo ou função relacionada ao problema;
- comportamento esperado;
- comportamento observado;
- passos para reproduzir;
- resultado de `npm run verify`;
- se houve ou não alteração/publicação das Firestore Rules.

Não forneça senha, chave privada ou JSON de conta de serviço.
