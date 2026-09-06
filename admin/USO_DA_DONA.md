# Como usar o painel do Açaí da Bea

Administração:

`https://charlysonfernades.github.io/acai-da-bea/admin/`

Site dos clientes:

`https://charlysonfernades.github.io/acai-da-bea/`

Não existe link público do site do cliente para o painel. O acesso administrativo depende do login e da autorização configurada no Firebase.

## Rotina de uso

1. Abra `/admin/` e entre com a conta autorizada.
2. Em **Loja**, atualize nome, WhatsApp, Instagram, URL do Instagram, endereço, horário e status do delivery quando necessário.
3. Em **Produtos**, altere preço, descrição, imagem, ordem, regras de personalização e disponibilidade.
4. Em **Personalizações**, gerencie grupos e opções, incluindo valores adicionais e disponibilidade.
5. Use **Ver site** para conferir o resultado no cardápio público.

## Cuidados

- Não compartilhe a senha da conta administrativa.
- Antes de salvar preço ou disponibilidade, confira se o produto correto está aberto.
- Se uma opção acabar temporariamente, prefira marcá-la como indisponível em vez de recriar o cadastro.
- O cliente recebe as atualizações do Firestore e o pedido é conferido novamente antes da abertura do WhatsApp.

A autorização real é feita pelo Firebase Authentication + Firestore Rules; descobrir o endereço `/admin/` não libera acesso administrativo.
