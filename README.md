MavaConnect Frontend

Este é o repositório do frontend do sistema MavaConnect, uma aplicação web desenvolvida para otimizar a gestão e o acompanhamento de visitantes em igrejas. Ele se comunica com o backend do MavaConnect para fornecer uma interface intuitiva e responsiva.

🚀 Tecnologias Utilizadas

•
React.js: Biblioteca JavaScript para construção de interfaces de usuário.

•
Vite: Ferramenta de build rápida para projetos web modernos.

•
Axios: Cliente HTTP baseado em Promises para fazer requisições ao backend.

•
React Router DOM: Para gerenciamento de rotas na aplicação single-page.

•
React Hot Toast: Para notificações e mensagens de feedback.

•
React Icons: Biblioteca de ícones populares.

•
React IMask: Para máscaras de entrada de dados.

•
Swiper: Biblioteca para sliders e carrosséis.

⚙️ Instalação

Para configurar o ambiente de desenvolvimento e instalar as dependências do projeto, siga os passos abaixo:

1.
Clone o repositório:

2.
Navegue até o diretório do projeto:

3.
Instale as dependências:

🔑 Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto com a seguinte variável de ambiente:

Plain Text


VITE_API_URL="http://localhost:3001"


•
VITE_API_URL: URL base da API do backend do MavaConnect. Altere para a URL do seu backend em produção, se aplicável.

▶️ Como Rodar o Projeto

Após a instalação das dependências e a configuração das variáveis de ambiente, você pode iniciar a aplicação frontend com o seguinte comando:

Bash


npm run dev


O aplicativo estará disponível em http://localhost:5173 (ou outra porta disponível, indicada pelo Vite).

📦 Build para Produção

Para gerar uma versão otimizada para produção, utilize o comando:

Bash


npm run build


Os arquivos de build serão gerados na pasta dist/.

🌐 Deploy

O frontend do MavaConnect pode ser facilmente implantado em plataformas de hospedagem estática, como a Vercel. Certifique-se de configurar a variável de ambiente VITE_API_URL na plataforma de deploy para apontar para o seu backend em produção.

📂 Estrutura de Pastas

•
src/: Contém o código-fonte da aplicação React.

•
src/App.jsx: Componente principal da aplicação.

•
src/main.jsx: Ponto de entrada da aplicação React.

•
src/components/: Componentes reutilizáveis da UI.

•
src/pages/: Páginas da aplicação (ex: Login, Dashboard, Visitantes).

•
src/routes/: Definição das rotas da aplicação.

•
src/services/: Lógica para comunicação com a API do backend.

•
src/assets/: Imagens, ícones e outros recursos estáticos.

•
src/styles/: Arquivos de estilo CSS/SCSS.



✨ Funcionalidades Principais

•
Autenticação de Usuários: Login seguro com JWT.

•
Gestão de Usuários: Cadastro, listagem e gerenciamento de usuários (admin e secretaria).

•
Gestão de Visitantes: Cadastro detalhado, listagem, busca por nome e filtro por data de visita.

•
Comunicação Direta: Link para contato via WhatsApp com visitantes.

•
Interface Responsiva: Design adaptável para diferentes tamanhos de tela, incluindo dispositivos móveis.

🤝 Contribuição

Contribuições são bem-vindas! Se você deseja contribuir com este projeto, siga os passos:

1.
Faça um fork do repositório.

2.
Crie uma nova branch para sua feature (git checkout -b feature/minha-feature).

3.
Faça suas alterações e commit (git commit -m 'feat: Adiciona nova feature').

4.
Envie para o seu fork (git push origin feature/minha-feature).

5.
Abra um Pull Request para a branch main deste repositório.

📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

