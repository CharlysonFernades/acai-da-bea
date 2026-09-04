# Açaí da Bea — Landing Page / Cardápio Digital

Projeto estático em **HTML + CSS + JavaScript puro**, feito para ser simples de editar e publicar no GitHub Pages.

## O que já está implementado

- layout mobile-first e responsivo;
- identidade visual roxo/creme/dourado baseada no cardápio original;
- cardápio com 6 tamanhos/opções confirmadas;
- preços em centavos para evitar erros de ponto flutuante;
- personalização por complementos, caldas, fruta e creme trufado;
- adicional de morango de R$ 2,00;
- carrinho com quantidade, remoção, subtotal e total;
- persistência do carrinho com `localStorage`;
- checkout para entrega ou retirada;
- endereço de entrega condicional;
- observações por item e observações gerais;
- mensagem organizada e preenchida para WhatsApp;
- botão geral de WhatsApp;
- Instagram configurado;
- seção do iFood preparada;
- SEO básico, Open Graph e Schema.org;
- acessibilidade básica e foco visível;
- sem frameworks, trackers, cookies desnecessários ou credenciais.

## Estrutura

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── data.js      # dados centrais do negócio e produtos
│   ├── cart.js      # estado/persistência do carrinho
│   └── app.js       # interface, checkout e WhatsApp
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

## Dados confirmados usados

Os seguintes dados vieram do cardápio original fornecido:

- nome: **Açaí da Bea**;
- WhatsApp/telefone: **(81) 97401-0159**;
- Instagram: **@acaidabea_**;
- Tradicional 300 ml: **R$ 16,90**;
- Tradicional 400 ml: **R$ 20,90**;
- Tradicional 500 ml: **R$ 24,90**;
- Premium Trufado 300 ml: **R$ 21,90**;
- Premium Trufado 400 ml: **R$ 25,90**;
- Premium Trufado 500 ml: **R$ 29,90**;
- morango: **+ R$ 2,00**;
- regras de complementos/caldas/frutas/cremes.

Também foi fornecido e configurado o **link direto oficial da loja no iFood**.

Pelo print do Google Maps fornecido depois, também foram confirmados:

- categoria no Google Maps: **Sorveteria**;
- endereço: **R. Ipu, 2102 - Tabapuazinho, Caucaia - CE, 61634-110**.

## Atenção: dados ainda não confirmados

Antes de publicar definitivamente, ainda falta confirmar principalmente:

```js
openingHours: [],  // [ADICIONAR HORÁRIO]
```

O link oficial do iFood já está configurado em `js/data.js`.

O botão de localização já usa uma busca direta no Google Maps baseada no endereço confirmado.

## Como alterar telefone / WhatsApp / Instagram

Abra `js/data.js` e edite somente o objeto `restaurant`:

```js
whatsappDisplay: '(81) 97401-0159',
whatsappDigits: '5581974010159',
phoneDisplay: '(81) 97401-0159',
phoneHref: 'tel:+5581974010159',
instagramHandle: '@acaidabea_',
instagramUrl: 'https://www.instagram.com/acaidabea_/',
ifoodUrl: 'https://www.ifood.com.br/delivery/recife-pe/acai-da-bea-jardim-sao-paulo/2e2ad808-9adb-4f1c-9eb5-f7189060ffd3',
```

Não é necessário procurar esses dados em vários arquivos.

## Como habilitar formas de pagamento

As formas de pagamento direto pelo WhatsApp **não foram confirmadas**, então ficam desabilitadas por padrão.

Em `js/data.js`:

```js
paymentMethods: [
  { id: 'pix', label: 'PIX', enabled: true },
  { id: 'cash', label: 'Dinheiro', enabled: true },
  { id: 'card', label: 'Cartão', enabled: true },
],
```

Habilite apenas o que o estabelecimento realmente aceitar.

## Como alterar produtos e preços

Todos os produtos ficam em `js/data.js`, no array `products`.

Exemplo:

```js
{
  id: 'trad-300',
  name: 'Açaí Tradicional 300 ml',
  category: 'Açaí Tradicional',
  description: 'Inclui até 4 complementos, até 2 caldas e 1 fruta.',
  priceCents: 1690,
  image: 'assets/images/tradicional-300.jpg',
  available: true,
  limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 0 },
}
```

Para mudar **R$ 16,90 para R$ 18,90**, use:

```js
priceCents: 1890
```

Nunca use `18.90` para os cálculos internos.

## Como adicionar um produto

1. Copie um objeto existente no array `products`.
2. Troque `id`, `name`, `category`, `description`, `priceCents` e `image`.
3. Coloque a nova foto em `assets/images/`.
4. Ajuste os limites de personalização.

## Como remover/desativar um produto

Sem apagar o cadastro, mude:

```js
available: false
```

## Como trocar imagens

Substitua os arquivos dentro de `assets/images/` ou altere a propriedade `image` do produto em `js/data.js`.

Prefira imagens WebP/JPEG otimizadas, idealmente entre 800 e 1200 px de largura.

## Como executar localmente

Na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

Não abra somente o `index.html` clicando no arquivo, pois o projeto usa módulos JavaScript.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos mantendo a estrutura das pastas.
3. Vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve.
7. Aguarde o GitHub gerar o endereço público.

Depois da publicação, adicione a URL final como `canonical` e `og:url` no `<head>` do `index.html`.

## Segurança e privacidade

- nenhuma senha, token ou API key no front-end;
- nenhuma coleta de CPF, RG, cartão, CVV ou senha;
- dados pessoais do checkout não são persistidos em `localStorage`;
- apenas o carrinho é salvo localmente;
- o site não envia WhatsApp automaticamente: abre a conversa com a mensagem pronta e o usuário confirma o envio;
- nenhum Analytics/Pixel foi adicionado.

## Observação sobre entrega

A taxa de entrega não foi informada. Por isso, o total exibido representa **somente os produtos** e a mensagem enviada informa que a taxa de entrega deve ser confirmada.


## Publicação no GitHub Pages

Repositório: `CharlysonFernades/acai-da-bea`

URL prevista: `https://charlysonfernades.github.io/acai-da-bea/`

O projeto é estático e pode ser publicado diretamente a partir da branch `main`, pasta `/ (root)`.
