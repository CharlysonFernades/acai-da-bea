# Segurança — Açaí da Bea

Este projeto usa um site público em GitHub Pages e Firebase para autenticação e dados do catálogo. O endereço do painel administrativo não é tratado como segredo: a proteção real depende do Firebase Authentication e das Firestore Rules publicadas.

## Princípios de segurança

- O site público pode ler somente os dados comerciais necessários ao cardápio.
- Alterações administrativas exigem usuário autenticado e um documento `admins/{UID}` ativo, com `role` autorizado e `storeId` correto.
- O navegador não possui permissão para criar ou alterar documentos de autorização administrativa.
- Exclusões de loja, produtos, grupos e opções são bloqueadas pelas Firestore Rules atuais.
- Campos graváveis são limitados por listas explícitas nas Rules.
- Qualquer caminho do Firestore não previsto termina em `deny-all`.
- O checkout recalcula e revalida os dados atuais antes de abrir o WhatsApp; valores guardados no carrinho não são autoridade final.

## Credenciais

Nunca coloque no repositório:

- senha da conta administrativa;
- chave privada;
- arquivo JSON de conta de serviço;
- `private_key`, `client_email` ou credenciais equivalentes.

O objeto de configuração Web do Firebase (`firebaseConfig`) é configuração pública do aplicativo. Ele não substitui as Firestore Rules e não deve ser tratado como mecanismo de autorização.

## Firestore Rules

O arquivo `firebase/firestore.rules` é a referência versionada das regras esperadas em produção.

A publicação continua sendo manual:

1. Firebase Console → Firestore Database → Rules.
2. Comparar o conteúdo com `firebase/firestore.rules` da `main`.
3. Publicar somente após `npm run verify` passar.
4. Fazer um teste real de leitura pública e um teste administrativo autorizado.

Nunca flexibilize temporariamente as Rules em produção para “fazer funcionar”. Se uma operação legítima for bloqueada, primeiro descubra qual regra ou dado está incompatível.

## Conta administrativa comprometida

Se houver suspeita de acesso indevido:

1. Desabilite a conta em Firebase Authentication.
2. Pelo Firebase Console, marque o documento `admins/{UID}` como inativo ou remova a autorização conforme a política adotada.
3. Troque a senha da conta afetada.
4. Revise produtos, opções e dados da loja no Firestore.
5. Execute a bateria de testes e valide o site público antes de reativar o acesso.

O painel do navegador não consegue conceder autorização administrativa a si mesmo.

## Verificação antes de publicar

Execute com Node.js 20 ou superior:

```bash
npm run verify
```

Esse comando verifica sintaxe dos arquivos principais e executa toda a suíte automatizada, incluindo invariantes de segurança.

Depois, faça também um teste manual do fluxo crítico:

1. abrir o cardápio;
2. montar um item válido;
3. confirmar que escolhas obrigatórias são exigidas;
4. alterar preço ou disponibilidade pelo painel e conferir a atualização;
5. revisar carrinho;
6. abrir o WhatsApp e conferir a mensagem final.

## Mudanças de alto risco

Considere como mudança de alto risco qualquer alteração em:

- `firebase/firestore.rules`;
- autenticação/autorização do painel;
- cálculo de preço;
- regras de personalização;
- reconciliação do carrinho;
- conferência do checkout;
- construção da mensagem do WhatsApp.

Essas mudanças devem ser feitas em branch separada e só chegar à `main` depois dos testes automatizados e manuais.
