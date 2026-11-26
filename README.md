Comunidade emo retrô com:

- contas reais no SQLite
- login por usuário ou e-mail
- senha com bcrypt
- sessão
- posts com foto/GIF
- comentários com foto/GIF anexados
- botão de figurinhas
- sistema para apagar os próprios posts, comentários, scraps, fotos, músicas e álbuns
- apagar a própria conta
- perfis personalizáveis com wallpaper por URL ou upload de imagem/GIF
- avatar por upload
- status online/offline
- busca de membros
- adicionar/remover amigos
- seguir/deixar de seguir
- bloquear
- scraps
- comentários de perfil
- Top 8
- álbuns
- playlist pública
- comunidades criadas pelos usuários
- página própria para cada comunidade
- temas diferentes por comunidade
- banner de comunidade
- entrada/saída de comunidades
- posts dentro das comunidades

## Rodar no PC

1. Instale Node.js 20+.
2. Abra o terminal dentro desta pasta.
3. Rode:

```bash
npm install
npm start
```

4. Abra `http://localhost:3000`.

O banco é criado automaticamente em `data/deadspace.db`.

## Importante sobre Netlify

Este projeto tem backend Node + SQLite. Ele não funciona como um simples site estático no Netlify.

Para deixar a versão REAL online, o backend precisa de hospedagem Node e um banco persistente. Uma opção simples é colocar este projeto em um serviço que rode Node continuamente. O domínio pode continuar sendo o seu domínio personalizado, apontando para o serviço escolhido.

Os arquivos de imagem ficam em `public/uploads` e, para produção, é recomendado usar armazenamento persistente/objeto em vez do disco local.

## Personalização

Cada usuário pode definir um wallpaper próprio no perfil usando uma URL ou enviando uma imagem/GIF. O crédito `criado por xX_Dead_Princess_Xx` fica fixo no canto inferior direito de todas as páginas.

## Cores das fotos/GIFs

O CSS não aplica `filter`, `grayscale`, `sepia` ou alteração de cor nas imagens. As fotos e GIFs aparecem nas cores originais do arquivo.
