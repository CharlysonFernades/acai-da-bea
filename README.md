# Açaí da Bea — protótipo do site do cliente

Protótipo inicial do cardápio digital da **Loja A** do Açaí da Bea.

## O que este protótipo tem

- página do cliente com visual em roxo + amarelo;
- cardápio com produtos e fotos;
- personalização básica de cremes, adicionais e coberturas;
- carrinho lateral;
- finalização com mensagem formatada no WhatsApp;
- horário atualizado: **terça a domingo, das 17:00 às 22:00**.

## Estrutura

```text
acai-da-bea-prototipo/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── assets/
    └── images/
```

## Como rodar

Basta abrir o arquivo `index.html` no navegador.

Se quiser testar com mais segurança, pode usar uma extensão como **Live Server** no VS Code.

## Onde alterar os dados principais

Abra `js/app.js`.

### WhatsApp

Procure:

```js
whatsappDisplay: '+55 85 92145-5990',
whatsappDigits: '5585921455990',
```

### Instagram

Procure:

```js
instagramHandle: '@acaibea',
instagramUrl: 'https://www.instagram.com/acaibea?stkn=MWIoYjJmM2NtNmN1bw=='
```

### Google Maps

Procure:

```js
mapsUrl: 'https://maps.app.goo.gl/E6QV2MibhUaMiP2w5'
```

### Horário

Procure:

```js
hoursLabel: 'terça a domingo, das 17:00 às 22:00'
```

## Como alterar produtos

No arquivo `js/app.js`, procure o array `PRODUCTS`.

Cada produto tem essa estrutura:

```js
{
  id: 'acai-330',
  name: 'Açaí de 330g',
  category: 'Mais pedido',
  priceCents: 1484,
  image: 'assets/images/acai-330.webp',
  description: '...',
  selectionRules: { acaiCremes: 4, adicionais: 4, coberturas: 2 }
}
```

### Para trocar o preço

Altere `priceCents`.

Exemplo:
- `1484` = R$ 14,84
- `4499` = R$ 44,99

### Para trocar a foto

1. coloque a imagem nova dentro de `assets/images/`
2. troque o caminho em `image`.

### Para adicionar um novo produto

Adicione um novo objeto dentro de `PRODUCTS`.

### Para remover um produto

Apague o objeto do produto dentro de `PRODUCTS`.

## Observação

Este projeto é a **versão do cliente**. O painel administrativo pode ser criado depois como um projeto separado ligado ao Firebase.
