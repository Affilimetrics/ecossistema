# Plano e execução de testes — AffiliMetrics

**Atualizado em:** 26/11/2026  
**Escopo desta revisão:** Issue 01 do roadmap — cadastro, autenticação, perfil e ciclo de vida da conta, além da organização das suítes de regressão já existentes.

## 1. Framework adotado

O projeto usa o executor nativo do Django (`django.test.TestCase` e `unittest`). Essa é a opção mais direta para a estrutura atual: a maior parte dos testes já foi escrita com as classes do Django e o executor integrado cria e destrói o banco de testes automaticamente. Não foi introduzido `pytest` nem `pytest-django`, evitando dependências e dois padrões de execução para o mesmo código.

Todos os testes de banco devem ser executados pelo executor do Django. Não rode funções de teste manualmente por importação Python.

## 2. Antes de testar

No CMD ou PowerShell, abra a pasta `aflmain` (a mesma que contém `manage.py`), ative o ambiente virtual e instale as dependências:

```bat
venv\Scripts\activate
python -m pip install -r requirements.txt
```

Configure o `.env` conforme `.env.example`. Para executar os testes localmente, o SQLite padrão é suficiente; o executor nativo do Django cria um banco temporário `test_...` e o descarta ao final.

## 3. Executar cada área isoladamente pelo CMD

Use `run_tests.cmd` na pasta `aflmain`. O script troca temporariamente `DATABASE_URL` por SQLite de teste, executa o comando solicitado e restaura as variáveis ao terminar. Assim, os testes não usam o PostgreSQL ou o SQLite operacional configurado no `.env`.

```bat
run_tests.cmd core.test_authentication.RegistrationTests
run_tests.cmd core.test_authentication.LoginTests
run_tests.cmd core.test_profile.ProfileTests
run_tests.cmd core.test_profile.AccountDeletionTests
run_tests.cmd core.test_test_runner
run_tests.cmd all
```

Os mesmos comandos podem ser chamados pelo PowerShell com `.\run_tests.cmd` (por exemplo, `.\run_tests.cmd core.test_profile.ProfileTests`). A alternativa é executar `python manage.py test ...` diretamente; nesse caso, confirme antes que `DATABASE_URL` aponta para um banco local descartável e nunca para produção. `run_tests.cmd` já faz essa proteção por você.

A tabela abaixo informa os rótulos Django correspondentes; pode ser usada diretamente no CMD/PowerShell quando o banco configurado for um banco de teste.

| Área / alteração | Comando isolado | O que a suíte cobre atualmente |
|---|---|---|
| Cadastro e política de senha (Issue 01) | `run_tests.cmd core.test_authentication.RegistrationTests` | Campos cadastrais, e-mail duplicado, confirmação e política de senha; hash BCrypt-SHA256. |
| Login e sessão (Issue 01) | `run_tests.cmd core.test_authentication.LoginTests` | Login por e-mail, contas legadas, duração da sessão, credenciais inválidas e redirecionamento seguro. |
| Perfil e preferências (Issue 01) | `run_tests.cmd core.test_profile.ProfileTests` | Edição de perfil, e-mail, metas, preferências, senha e foto. |
| Exclusão de conta (Issue 01) | `run_tests.cmd core.test_profile.AccountDeletionTests` | Confirmação, relações protegidas, cascata, dados de outras contas e remoção da foto. |
| Core e ofertas | `run_tests.cmd core.tests` | Serviços de ofertas, autenticação existente, acesso protegido, templates e ranking de produtos. |
| Ferramentas integradas na Home | `run_tests.cmd core.test_advanced_tools` | Rotas namespaced, autenticação compartilhada, métricas e isolamento CPA/ROI. |
| Painel local de testes | `run_tests.cmd core.test_testing_portal` | Acesso staff, restrição a DEBUG e execução somente de suítes allowlisted. |
| Executor isolado de testes | `run_tests.cmd core.test_test_runner` | Confirma que o painel sobrescreve `DATABASE_URL` com SQLite temporário, usa apenas suítes permitidas e respeita o bloqueio fora de DEBUG. |
| API Desktop | `run_tests.cmd core.test_desktop_api` | Login da API, rejeição de credenciais, ingestão e isolamento por proprietário. |
| Magalu / links de afiliado | `run_tests.cmd magalu_bot.tests.test_afiliados` | Domínios aceitos/rejeitados, extração de link e leitura de comissão. |
| Tráfego Pago (TPB) | `run_tests.cmd ads_manager.tests` | Login compartilhado, isolamento de contas, snapshots de campanhas, falha de sincronização e criptografia de tokens. |
| LTV Manager | `run_tests.cmd ltv.tests.test_importer ltv.tests.test_metrics` | Prévia/importação, idempotência, métricas, coortes, login e isolamento de aquisições. |
| CPA Manager | `run_tests.cmd cpa.tests.test_analytics cpa.tests.test_importer` | Importação CSV/XLSX, normalização, métricas, API com token e isolamento de campanhas. |
| ROI Manager | `run_tests.cmd financeiro.tests.test_frontend financeiro.tests.test_roi` | Cálculos de ROI, telas, importação e dimensões do usuário. |
| Desktop / parser Mercado Livre | `run_tests.cmd desktop_app.tests.test_ml_output` | Leitura de produtos e rejeição de saídas/links inválidos. |
| Projeto inteiro (todos os módulos catalogados) | `run_tests.cmd all` | Executa explicitamente todas as suítes listadas, inclusive os pacotes Magalu e Desktop que não são apps Django instalados. |
| Descoberta padrão do Django | `python manage.py test` | Executa a descoberta padrão nos apps instalados; não substitui o comando completo acima. |

### Executar um único caso de teste

Para investigar uma funcionalidade sem rodar o módulo inteiro, informe também a classe e o método. Exemplo:

```bat
run_tests.cmd core.test_profile.ProfileTests.test_profile_can_change_password_without_losing_session
```

## 4. Executar pela página dentro do projeto

A interface de testes é uma ferramenta de desenvolvimento e, por segurança, exige `DEBUG=True` e um usuário com `is_staff=True`. Ela não fica disponível em produção.

1. Inicie o projeto: `python manage.py runserver`.
2. Entre com um usuário staff. Para criar um, execute `python manage.py createsuperuser` e conclua o cadastro administrativo.
3. Abra `http://127.0.0.1:8000/desenvolvimento/testes/`.
4. Escolha a funcionalidade (Cadastro, Login, Perfil ou Exclusão de conta) ou outro módulo e clique em **Executar esta suíte**.
5. Leia o resultado e a saída do executor. **Aprovado** significa código de saída zero; **Falhou** exige analisar o primeiro erro/traceback apresentado.

Cada execução feita pela página inicia um processo separado do Django, com uma variável `DATABASE_URL` apontando para um arquivo SQLite temporário. Esse arquivo é removido ao terminar a execução. A página não recebe nomes de módulos arbitrários: somente as suítes pré-definidas neste documento podem ser chamadas.

A página executa testes automatizados, não substitui verificações de navegador que dependam de serviços externos. OAuth real, permissões Meta e operações remotas exigem credenciais e ambiente de homologação específicos.

## 5. Verificações obrigatórias para cada alteração

Toda alteração de modelo, rota, formulário, regra de negócio ou integração deve acrescentar/atualizar um caso isolado correspondente. O teste deve comprovar o comportamento válido e ao menos um cenário inválido ou limite aplicável. Além do teste de unidade, verifique o sistema Django e as migrations:

```bat
python manage.py check
python manage.py makemigrations --check --dry-run
run_tests.cmd core.test_authentication
run_tests.cmd core.test_profile
run_tests.cmd core.test_test_runner
run_tests.cmd all
```

Antes de concluir uma entrega, execute também as regressões das áreas afetadas e, quando possível, a suíte completa:

```bat
run_tests.cmd all
```

Depois de confirmar o plano de migração, aplique as alterações de banco:

```bat
python manage.py migrate --plan
python manage.py migrate
```

Não use `flush`, não apague o banco local e não remova migrations para resolver falhas.

## 6. Matriz de testes obrigatórios — Issue 01

| Alteração implementada | Teste isolado obrigatório |
|---|---|
| Cadastro com nome, e-mail, nascimento, telefone e localização | `RegistrationTests.test_registration_creates_user_profile_and_bcrypt_sha256_hash` |
| Unicidade de e-mail, inclusive diferenças entre maiúsculas/minúsculas | `RegistrationTests.test_duplicate_email_is_rejected_case_insensitively` |
| Senha mínima de 8 caracteres, com número e caractere especial (cadastro e alteração no perfil) | `RegistrationTests.test_short_password_is_rejected`, `RegistrationTests.test_password_without_number_is_rejected`, `RegistrationTests.test_password_without_special_character_is_rejected` e `ProfileTests.test_profile_rejects_new_password_without_number_or_special_character` |
| Confirmação da senha | `RegistrationTests.test_mismatched_password_confirmation_is_rejected` |
| Data de nascimento e fuso horário | `RegistrationTests.test_future_birth_date_and_invalid_timezone_are_rejected` |
| Login por e-mail normalizado e compatibilidade com contas antigas em maiúsculas | `LoginTests.test_login_accepts_email_case_insensitively` e `LoginTests.test_login_accepts_legacy_mixed_case_username` |
| Lembrar sessão sem persistir senha | `LoginTests.test_remember_me_extends_session_without_persisting_password` e `LoginTests.test_session_expires_at_browser_close_when_remember_me_is_unchecked` |
| Bloqueio de redirecionamento externo após login | `LoginTests.test_external_next_url_is_not_allowed` |
| Compatibilidade com hashes PBKDF2 existentes | `LoginTests.test_legacy_pbkdf2_hash_is_accepted_and_upgraded_after_login` |
| Alteração de nome, telefone, nascimento, metas e preferências | `ProfileTests.test_profile_updates_personal_data_goals_and_preferences` |
| Atualização de e-mail também atualiza o identificador de login | `ProfileTests.test_profile_email_change_updates_username_and_email` |
| Rejeição de e-mail pertencente a outra conta | `ProfileTests.test_profile_rejects_email_already_used_by_another_account` |
| Validação de metas e data futura | `ProfileTests.test_profile_rejects_negative_goals_and_future_birth_date` |
| Alteração de senha preservando a sessão corrente | `ProfileTests.test_profile_can_change_password_without_losing_session` |
| Confirmação da nova senha | `ProfileTests.test_profile_rejects_mismatched_new_password` |
| Upload, validação e remoção de foto | `ProfileTests.test_profile_accepts_valid_uploaded_photo`, `ProfileTests.test_profile_rejects_non_image_upload` e `ProfileTests.test_profile_can_remove_existing_photo` |
| Validação do fuso no perfil | `ProfileTests.test_profile_rejects_invalid_timezone` |
| Exclusão protegida por senha e confirmação explícita | `AccountDeletionTests.test_wrong_password_does_not_delete_account`, `AccountDeletionTests.test_missing_confirmation_does_not_delete_account` |
| Exclusão em cascata, relações `PROTECT` e preservação de dados de outras contas | `AccountDeletionTests.test_account_deletion_cascades_owned_core_cpa_ltv_roi_data_only` (inclui produto, marketplace, canal e campanha do ROI) |
| Limpeza do arquivo da foto ao excluir a conta | `AccountDeletionTests.test_account_deletion_removes_profile_photo_after_commit` |
| Exclusão somente por POST | `AccountDeletionTests.test_account_deletion_rejects_get` |

## 7. Interpretação e limites de cobertura

A matriz do item 3 inclui **todos os módulos de teste automatizados encontrados nesta versão do ZIP**: Core, API Desktop, Magalu, TPB, LTV, CPA, ROI e parser Desktop. Como Magalu e Desktop possuem pacotes de testes que não estão em `INSTALLED_APPS`, a suíte completa usa rótulos explícitos; o comando padrão `python manage.py test` sozinho não garante a execução desses pacotes. As suítes testam os comportamentos indicados na tabela, não comprovam todos os cenários possíveis de cada módulo nem substituem um teste de aceitação operacional com serviços externos reais.

Ao adicionar uma funcionalidade, inclua o teste novo na suíte apropriada, atualize esta matriz e disponibilize o comando isolado correspondente. Não declare cobertura de um fluxo se ele não tiver um teste executável.

## 8. Regras para dados de teste

- Use usuários, produtos, contas e credenciais fictícios.
- Não use tokens de produção, cookies pessoais ou banco de produção nos testes.
- Mocke chamadas externas nos testes automatizados; não dispare publicações reais nem alterações em plataformas externas.
- O teste deve criar seus próprios dados e não depender de ordem de execução.
- Prefira `TestCase` quando houver interação com banco e `SimpleTestCase` para funções sem banco.
- Garanta que dados de um usuário não sejam visíveis, alteráveis ou excluídos por outro usuário.
