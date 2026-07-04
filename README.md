# MyBooks

MyBooks e uma aplicacao full-stack para organizar uma biblioteca pessoal indo alem de um CRUD simples de livros. O projeto separa tres conceitos que normalmente ficam misturados: **obra**, **leitura** e **exemplar**.

Essa modelagem permite registrar que uma obra foi lida mesmo sem estar na biblioteca, cadastrar mais de uma edicao da mesma obra, controlar exemplares fisicos/digitais e lidar com casos reais como livros em multiplos volumes.

## Destaques

- Catalogo de obras com autor, genero, categoria, colecao/serie e ano original.
- Registro de leituras com status, datas, nota, resenha, favoritos e releitura.
- Cadastro de exemplares com editora, colecao editorial, edicao, ISBN, idioma(s), localizacao, estado, preco e volumes.
- Agrupamento de obras por colecoes, autores, generos e categorias.
- Busca e ordenacao por recentes, titulo, autor, ano, genero e exemplares.
- Dashboard com metricas de obras, leituras e biblioteca.
- Backup CSV dos exemplares.
- Banco local com SQLite e migracoes automaticas na inicializacao.

## Stack

**Frontend**

- React
- CSS modularizado por componentes/telas
- Create React App

**Backend**

- .NET 8
- Minimal APIs
- Entity Framework Core
- SQLite
- Swagger em ambiente de desenvolvimento

## Modelagem principal

O projeto foi desenhado ao redor de tres entidades centrais:

### Obra

Representa o conteudo intelectual: por exemplo, `O Conde de Monte Cristo`.

Campos importantes:

- titulo
- autor
- genero
- categoria
- colecao/serie
- numero na colecao
- ano original
- descricao

### Leitura

Representa a experiencia de leitura de uma obra.

Campos importantes:

- status
- data de inicio
- data de termino
- nota
- resenha
- anotacoes
- favorito
- quero reler

### Exemplar

Representa a edicao que existe na biblioteca.

Campos importantes:

- formato
- editora
- colecao editorial
- edicao
- ISBN
- idioma(s)
- paginas
- volumes
- estado
- localizacao
- aquisicao
- preco

Essa separacao permite exemplos como:

- uma obra lida, mas sem exemplar cadastrado;
- uma obra com dois exemplares diferentes;
- um exemplar fisico dividido em tres volumes;
- uma edicao bilingue registrada como `Portugues, Frances`.

## Funcionalidades

### Catalogo

A tela principal permite navegar entre:

- Obras
- Leituras
- Biblioteca

Em `Obras`, a faixa de agrupamento permite reorganizar a lista por:

- Todos
- Colecoes
- Autores
- Generos
- Categorias

Categorias podem representar recortes flexiveis, como:

- Historia do Brasil
- Literatura Francesa
- Biografia
- Filosofia Antiga
- Romance historico

### Leituras

Cada obra pode ter registros de leitura com status, periodo, nota e observacoes. A edicao dessas informacoes acontece no fluxo de `Nova leitura` ou `Editar`, mantendo o card de detalhes mais limpo.

### Biblioteca

Cada obra pode ter um ou mais exemplares. Isso cobre casos como:

- edicoes diferentes da mesma obra;
- livros fisicos, ebooks e audiobooks;
- edicoes bilingues;
- volumes fisicos de uma mesma obra;
- localizacao do exemplar na biblioteca.

### Backup CSV

O endpoint abaixo exporta os exemplares cadastrados:

```txt
GET /api/backups/copies.csv
```

O CSV inclui dados da obra e do exemplar, como titulo, autor, genero, categoria, editora, edicao, idioma, volumes, localizacao e observacoes.

## Como rodar localmente

### Requisitos

- .NET 8 SDK
- Node.js
- npm

### Backend

```bash
cd backend/BooksApi
dotnet run --urls http://localhost:5043
```

A API fica disponivel em:

```txt
http://localhost:5043
```

Em ambiente de desenvolvimento, o Swagger fica disponivel em:

```txt
http://localhost:5043/swagger
```

### Frontend

Em outro terminal:

```bash
cd frontend/books_front
npm install
npm start
```

O frontend roda em:

```txt
http://localhost:3000
```

> Observacao: o frontend esta em `frontend/books_front`. Rodar `npm start` diretamente em `frontend` nao funciona porque ali nao existe `package.json`.

## Endpoints principais

```txt
GET    /api/catalog
GET    /api/works
GET    /api/works/{id}
POST   /api/works
PUT    /api/works/{id}
DELETE /api/works/{id}

POST   /api/works/{id}/readings
PUT    /api/works/{workId}/readings/{readingId}
DELETE /api/works/{workId}/readings/{readingId}

POST   /api/works/{id}/copies
PUT    /api/works/{workId}/copies/{copyId}
DELETE /api/works/{workId}/copies/{copyId}

GET    /api/backups/copies.csv
```

## Decisoes de arquitetura

### Separar obra, leitura e exemplar

Essa foi a decisao central do projeto. Uma obra nao e a mesma coisa que uma leitura, e tambem nao e a mesma coisa que o livro fisico na estante. Essa separacao deixa o sistema mais fiel ao uso real de uma biblioteca pessoal.

### VolumeCount no exemplar

Algumas obras estao em mais de um volume fisico. Por isso, o exemplar tem `VolumeCount`. Assim, uma obra pode ter um exemplar, mas esse exemplar pode representar dois ou tres volumes fisicos.

### Categoria flexivel

`Categoria` nao e obrigatoria e nao substitui `Genero`. Ela serve para recortes pessoais ou tematicos, como `Historia do Brasil`, `Literatura Francesa` ou `Brasil Imperio`.

### SQLite local

SQLite foi escolhido por ser simples, portavel e suficiente para uma aplicacao pessoal local. O banco fica no backend e as migracoes sao aplicadas automaticamente na inicializacao.

### Backup CSV

O backup CSV foi priorizado porque e simples de abrir em planilhas, facil de versionar e util para proteger o cadastro de exemplares.

## Estrutura do projeto

```txt
MyBooks/
  backend/
    BooksApi/
      Data/
      Dtos/
      Endpoints/
      Models/
      Services/
      Program.cs
  frontend/
    books_front/
      src/
        api/
        components/
        constants/
        utils/
        App.js
        App.css
```

## Melhorias futuras

- Agrupamentos especificos para Biblioteca.
- Contador de volumes no dashboard.
- Ordenacao especial dentro de colecoes/series.
- Tags ou categorias em formato de chips.
- Testes automatizados para regras de catalogo, agrupamento e exportacao CSV.
- Screenshots e GIFs de demonstracao no README.
- Deploy de uma versao demo.

## Objetivo do projeto

MyBooks foi construido como um projeto pratico de organizacao pessoal e tambem como portfolio full-stack. O foco esta em modelagem de dominio, experiencia de uso e evolucao incremental de uma aplicacao real.
