# Implantação do cardápio oficial

Este procedimento deve ser usado quando a loja entregar a lista real de produtos, preços e personalizações.

## Conceitos

- **Produto:** item vendido, como Açaí 330g ou Garrafa 500ml.
- **Grupo:** categoria de personalização, como Açaí e cremes, Adicionais, Coberturas ou Sabores da garrafa.
- **Opção:** escolha dentro de um grupo, como Banana, Creme de Ninho ou Chocolate.
- **Mínimo:** quantidade que o cliente é obrigado a selecionar naquele grupo.
- **Máximo:** limite de escolhas permitidas naquele grupo.

## Antes de cadastrar qualquer coisa

Primeiro monte a lista completa fora do painel. Não comece a cadastrar enquanto ainda estiver descobrindo o cardápio.

Para cada produto, confirme:

- nome;
- preço;
- descrição;
- foto;
- se fica visível;
- grupos usados;
- mínimo e máximo de cada grupo;
- opções pertencentes a cada grupo;
- opções com preço adicional;
- itens que podem ficar temporariamente indisponíveis.

## Atenção ao catálogo provisório

Enquanto as coleções de grupos e opções reais estão vazias, o site possui dados provisórios usados para demonstração.

Ao iniciar a criação de grupos/opções remotos, o site pode começar a considerar o catálogo do Firestore. Por isso, uma migração feita pela metade pode deixar personalizações incompletas ou produtos temporariamente indisponíveis.

### Procedimento seguro

1. Faça a implantação em horário de baixo movimento ou com a loja avisada.
2. Tenha a lista completa de grupos e opções pronta antes de começar.
3. Crie primeiro o grupo obrigatório principal dos produtos atuais (`Açaí e cremes`, se confirmado pelo cardápio real).
4. Cadastre imediatamente opções suficientes para satisfazer o mínimo exigido pelos produtos.
5. Em seguida, crie os demais grupos e todas as suas opções.
6. Só associe produtos novos/futuros aos grupos depois que as opções desses grupos estiverem completas.
7. Revise mínimo e máximo de cada produto.
8. Teste todos os produtos no site do cliente.
9. Teste um pedido completo até o WhatsApp.
10. Somente depois considere a migração concluída.

Se o cardápio oficial for muito diferente do demonstrativo, prefira ocultar temporariamente produtos que ainda não estejam prontos em vez de deixá-los vendáveis com regras incompletas.

## Exemplo

### Açaí 330g

- Açaí e cremes: mínimo 1, máximo 4.
- Adicionais: mínimo 0, máximo 4.
- Coberturas: mínimo 0, máximo 2.

### Garrafa 500ml

Um produto futuro pode usar somente:

- Sabores da garrafa: mínimo 1, máximo 1.

O sistema não depende de um tipo fixo “açaí” ou “garrafa”; cada produto recebe os grupos que realmente utiliza.

## Diferença entre esgotar e ocultar

- **Esgotado:** o cliente ainda enxerga o produto, mas não consegue pedir.
- **Oculto:** o produto desaparece do cardápio público sem apagar seu cadastro.

Use **Esgotado** quando a falta for temporária e fizer sentido o cliente saber que o item existe.

Use **Oculto** quando o produto não estiver sendo oferecido naquele período ou não deva aparecer ao cliente.

## Dados iniciais

Os botões de criação de dados iniciais existem apenas para coleções vazias e não devem ser usados como ferramenta normal de manutenção.

Depois que o cardápio oficial estiver implantado e validado, o fluxo de dados demonstrativos pode ser removido da interface administrativa em uma mudança separada e testada.

## Teste obrigatório após implantação

Para cada produto importante:

1. abrir o produto;
2. tentar continuar sem cumprir um mínimo obrigatório;
3. selecionar o máximo permitido;
4. tentar ultrapassar o máximo;
5. adicionar ao carrinho;
6. conferir preço e escolhas;
7. alterar disponibilidade no painel;
8. conferir a reação do site/carrinho;
9. restaurar o produto;
10. finalizar um pedido real de teste até a abertura do WhatsApp.

Depois execute:

```bash
npm run verify
```

Se alguma Firestore Rule tiver sido alterada para suportar o novo catálogo, publique-a separadamente no Firebase Console e repita os testes administrativos.
