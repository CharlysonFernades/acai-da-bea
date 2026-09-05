# Açaí da Bea — protótipo do cardápio + painel administrativo

Versão inicial feita para apresentar a proposta à **Loja A — Açaí da Bea** antes de conectar o painel ao Firebase em produção.

## Fonte de verdade usada nesta versão

- Instagram: `@acaibea`
- Google Maps: https://maps.app.goo.gl/E6QV2MibhUaMiP2w5
- WhatsApp: `+55 85 92145-5990`
- iFood: **não utilizado**
- Delivery próprio: **ainda não disponível**, então o protótipo combina o atendimento diretamente pelo WhatsApp.

### Cardápio confirmado pelas imagens enviadas

| Produto | Preço | Regra confirmada |
| --- | ---: | --- |
| Açaí de 330g | R$ 14,84 | até 4 opções entre Açaí e Cremes + 4 adicionais + 2 coberturas |
| Açaí de 750g | R$ 33,74 | até 6 opções entre Açaí e Cremes + 6 adicionais + 2 coberturas |
| Açaí de 1 kg | R$ 44,99 | até 8 opções entre Açaí e Cremes + 8 adicionais + 2 coberturas |
| Salada de fruta gourmet 400 ml | R$ 14,00 | creme de morango e creme de avelã; preço anterior exibido R$ 15,50 |

Nos três açaís, o catálogo informa que tudo que é escolhido entra como parte do peso do produto.

> **Importante:** os nomes de cremes, adicionais e coberturas presentes no protótipo são exemplos genéricos para demonstrar o funcionamento. A lista definitiva precisa ser confirmada com a proprietária.

## O que já funciona

### Site do cliente (`/`)

- mobile-first;
- produtos, preços e limites de personalização confirmados;
- personalização por grupos;
- ingrediente esgotado aparece bloqueado;
- produto esgotado fica visível com botão desativado;
- carrinho com quantidade e remoção;
- geração automática da mensagem de pedido para o WhatsApp correto;
- links para Instagram e Google Maps da Loja A;
- nenhuma informação pessoal do cliente é salva pelo protótipo.

### Painel administrativo (`/admin/`)

- dashboard simples para celular;
- marcar produto como disponível/esgotado;
- editar nome, preço, descrição e limites;
- cadastrar novo produto;
- marcar ingrediente como disponível/esgotado;
- cadastrar novo ingrediente;
- editar WhatsApp, Instagram, Maps e frase da loja;
- botão para abrir o site do cliente;
- alterações sincronizadas pelo `localStorage` quando site e painel são abertos na mesma origem/navegador.

## Como mostrar o protótipo agora

Este trabalho está na branch **`painel-admin`**. Não foi publicado no GitHub Pages.

Não abra os HTMLs diretamente com `file://`, pois site e painel precisam compartilhar a mesma origem para demonstrar a sincronização.

### Linux / macOS

```bash
git clone https://github.com/CharlysonFernades/acai-da-bea.git
cd acai-da-bea
git checkout painel-admin
python3 -m http.server 8080
```

### Windows

```powershell
git clone https://github.com/CharlysonFernades/acai-da-bea.git
cd acai-da-bea
git checkout painel-admin
py -m http.server 8080
```

Depois acesse:

- Site cliente: `http://localhost:8080/`
- Painel: `http://localhost:8080/admin/`

Para mostrar no celular usando a mesma rede Wi‑Fi, rode o servidor no computador e abra no celular `http://IP-DO-COMPUTADOR:8080/`.

## Demonstração recomendada para a proprietária

1. Abra o site cliente e mostre o cardápio.
2. Abra `/admin/` em outra aba.
3. Em **Ingredientes**, desative um item (ex.: Morango).
4. Volte ao site e atualize: o ingrediente aparece como esgotado/bloqueado.
5. No painel, altere o preço de um produto.
6. Volte ao site: o novo preço aparece.
7. Cadastre um produto de teste e mostre que ele entra no cardápio sem editar código.
8. Monte um pedido no site e mostre a mensagem pronta para o WhatsApp.

## Arquitetura depois da aprovação

O protótipo usa `localStorage` propositalmente para a apresentação rápida. A evolução planejada é:

```text
Painel Admin  ── Firebase Auth ──┐
                                ├── Cloud Firestore ── Site cliente
Dona da loja ── conta própria ──┘
```

O projeto Firebase já foi criado e as regras iniciais de segurança foram preparadas. A próxima etapa é substituir a camada local por Firestore, mantendo a interface do painel.

### Segurança planejada

- cliente público: somente leitura dos dados necessários;
- admin autenticado e autorizado: escrita;
- autorização por UID/registro administrativo, não apenas por e-mail;
- `admins` protegido contra autoelevação de privilégio;
- revalidação do carrinho antes do envio;
- sem chaves privadas ou service accounts no front-end.

## Estrutura principal

```text
/
├── index.html
├── css/style.css
├── js/
│   ├── app.js
│   └── demo-store.js
├── assets/images/
│   ├── acai-330.svg
│   ├── acai-750.svg
│   ├── acai-1kg.svg
│   └── salada-gourmet.svg
└── admin/
    ├── index.html
    ├── admin.css
    └── admin.js
```

## Antes de publicar para clientes reais

Confirmar com a proprietária:

- lista oficial de Açaí e Cremes;
- lista oficial de adicionais;
- lista oficial de coberturas;
- adicionais pagos e respectivos valores, se existirem;
- forma de retirada/entrega;
- horários;
- endereço textual confirmado;
- regras para promoções;
- fotos definitivas autorizadas para uso no site.
