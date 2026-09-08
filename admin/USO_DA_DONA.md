# Como usar o painel do Açaí da Bea

Administração:

`https://charlysonfernades.github.io/acai-da-bea/admin/`

Site dos clientes:

`https://charlysonfernades.github.io/acai-da-bea/`

Não existe link público do site do cliente para o painel. O acesso administrativo depende do login e da autorização configurada no Firebase.

## Rotina de uso

1. Abra `/admin/` e entre com a conta autorizada.
2. Em **Loja**, atualize nome, WhatsApp, Instagram, link do Instagram, endereço, horário e status do delivery quando necessário.
3. Em **Produtos**, altere preço, descrição, imagem, ordem e regras de personalização.
4. Use **Disponível/Esgotado** para controlar estoque temporário.
5. Use **No cardápio/Oculto** para decidir se o produto aparece ou desaparece completamente para o cliente.
6. Em **Personalizações**, crie/edite grupos e opções, incluindo valor adicional, ordem e disponibilidade das opções.
7. Ao editar um produto, marque os grupos usados e defina o **mínimo** e o **máximo** de escolhas.
8. Use **Ver site** para conferir o resultado no cardápio público.

## Disponível, Esgotado e Oculto

### Disponível

O produto aparece e pode ser pedido normalmente.

### Esgotado

O produto continua aparecendo, mas o cliente não consegue adicioná-lo ao pedido. Use quando a falta for temporária.

### Oculto

O produto some do cardápio do cliente sem apagar o cadastro. Use quando ele não estiver sendo vendido naquele período.

## Grupos e opções

- **Grupo:** categoria da escolha. Ex.: `Açaí e cremes`, `Adicionais`, `Coberturas`.
- **Opção:** item dentro do grupo. Ex.: `Banana`, `Granola`, `Creme de Ninho`.
- **Mínimo:** quantas escolhas o cliente precisa fazer.
- **Máximo:** quantas escolhas o cliente pode fazer.

Exemplo: se `Açaí e cremes` estiver com mínimo 1 e máximo 4, o cliente precisa escolher pelo menos uma opção e não consegue ultrapassar quatro.

## Cuidados

- Não compartilhe a senha da conta administrativa.
- Antes de salvar preço ou disponibilidade, confira se o produto correto está aberto.
- Se uma opção acabar temporariamente, prefira marcá-la como indisponível em vez de recriar o cadastro.
- Não use os botões de criação de dados iniciais em um catálogo que já esteja preenchido.
- Não altere mínimo/máximo sem saber a regra real daquele produto.
- Depois de uma mudança importante, abra **Ver site** e faça um teste como cliente.
- O cliente recebe atualizações do Firestore e o pedido é conferido novamente antes da abertura do WhatsApp.

A autorização real é feita pelo Firebase Authentication + Firestore Rules; descobrir o endereço `/admin/` não libera acesso administrativo.
