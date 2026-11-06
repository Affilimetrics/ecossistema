# Correção do build Windows e das migrations do cadastro

Esta revisão corrige dois problemas encontrados após a primeira entrega do Skallora Desktop.

## 1. Build: Python 3.12 não encontrado

O `build_windows.bat` anterior chamava exclusivamente `py -3.12`. Em computadores com somente Python 3.14 instalado, o launcher respondia `No suitable Python runtime found` e o build parava antes de criar o ambiente virtual.

O script atualizado:

1. tenta Python 3.12 primeiro;
2. se não encontrar, tenta o Python padrão registrado no launcher (`py -3`);
3. se necessário, tenta o comando `python` no PATH;
4. cria o ambiente local `desktop_app/.venv` com o interpretador selecionado;
5. instala os requisitos e chama PyInstaller pelo próprio ambiente virtual.

Python 3.12 continua sendo a opção recomendada por compatibilidade de pacotes. O fallback para 3.14 resolve a detecção do runtime; não garante que todos os pacotes de terceiros tenham wheels compatíveis. Se o `pip install` falhar por incompatibilidade, instale Python 3.12 e repita.

## 2. Cadastro: tabela `core_perfilusuario` ausente

A versão anterior continha `core/migrations/__init__.py`, mas não continha migrations de fato. A orientação `migrate --run-syncdb` não era suficiente: como o módulo de migrations do app `core` existe, o Django não o classifica como app sem migrations para sincronização automática.

Esta revisão restaura as migrations históricas `0001` a `0008` do próprio projeto, corrige a dependência de `0008` para o nome real do arquivo `0007_loop_categorias_e_perfil_timezone.py` e acrescenta `0009_produto_indicadores_e_progresso_coleta.py` para os campos/modelo presentes no `models.py` atual.

A tabela `PerfilUsuario` é criada por `0007_loop_categorias_e_perfil_timezone.py`.

## 3. Passo a passo para corrigir a instalação local

1. Feche o servidor Django.
2. Faça uma cópia de segurança do arquivo `aflmain/db.sqlite3` (ou do banco apontado por `DATABASE_URL`).
3. Substitua os arquivos do projeto pela versão corrigida, preservando seu `.env` e o banco `db.sqlite3`.
4. Abra o terminal na pasta `aflmain`, onde está `manage.py`.
5. Ative o ambiente virtual usado pelo Django:

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

6. Confira o estado das migrations e aplique-as:

   ```powershell
   python manage.py showmigrations core
   python manage.py migrate
   ```

7. Verifique a aplicação:

   ```powershell
   python manage.py check
   python manage.py runserver 127.0.0.1:8000
   ```

8. Tente criar a conta novamente.

Não execute `flush`, não apague `db.sqlite3` e não crie manualmente a tabela. A migration deve criá-la mantendo os dados que já existirem nas tabelas anteriores.

## 4. Se `migrate` informar que uma tabela já existe

Pare e não use `--fake` automaticamente. Isso pode indicar que o banco foi criado por uma versão diferente ou recebeu tabelas manualmente. Guarde o erro completo e verifique a tabela `django_migrations` e o esquema real antes de reconciliar o estado. A migration inicial só deve ser marcada como aplicada quando todas as tabelas/colunas previstas por ela realmente existirem e forem compatíveis.

## 5. Build do desktop

1. Abra `aflmain/desktop_app` no Windows.
2. Execute `build_windows.bat`.
3. O script seleciona Python 3.12 se estiver disponível ou tenta o runtime padrão instalado.
4. Se a instalação dos requisitos concluir e o PyInstaller finalizar, o executável estará em `desktop_app/dist/Skallora/Skallora.exe`.
5. Distribua a pasta `dist/Skallora` inteira.

Se o Python 3.14 for detectado mas algum requisito não puder ser instalado, instale Python 3.12 e execute novamente. A mensagem original do usuário ocorreu na etapa de criação do ambiente virtual, antes da instalação dos pacotes.

## 6. Escopo da validação

A revisão foi verificada estaticamente no ambiente de preparação: dependências entre arquivos de migration, presença da criação de `PerfilUsuario`, presença da migration nova, sintaxe dos scripts e integridade do ZIP. Não foi possível executar as migrations no SQLite do usuário nem compilar um `.exe` Windows neste ambiente Linux. A confirmação final deve ser feita no banco e no Windows da instalação destinatária.
