# Como a dona da loja acessa o painel

Depois que a branch for validada e mesclada na `main`, o painel ficará em:

`https://charlysonfernades.github.io/acai-da-bea/admin/`

O site dos clientes continua em:

`https://charlysonfernades.github.io/acai-da-bea/`

Não existe link público do cliente para o painel.

## Rotina de uso

1. Abrir `/admin/`.
2. Entrar com e-mail e senha cadastrados no Firebase Authentication.
3. Em **Loja**, editar telefone, Instagram, endereço, horário e ativar/desativar delivery.
4. Em **Produtos**, alterar preço, descrição, disponibilidade e grupos de personalização.
5. Em **Personalizações**, ligar/desligar opções que estejam em falta.
6. Usar **Ver site** para conferir a alteração no cardápio do cliente.

A autorização real é feita pelo Firebase Authentication + Firestore Rules; descobrir o endereço `/admin/` não libera acesso administrativo.
