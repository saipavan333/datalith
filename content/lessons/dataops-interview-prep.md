# DataOps & Infrastructure — interview prep & cheat sheet

Rapid-review for the DataOps track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Git** → working dir → staging → commit → remote; merge (true history) vs rebase (linear, never on shared).
- **PR + CI** → review + automated tests gate `main`; GitHub Actions run CI/CD from the repo.
- **CI/CD for data** → test code AND data (sample tests pre-merge, runtime tests in prod); handle stateful tables.
- **Containers** → reproducible image kills "works on my machine"; image=blueprint, container=instance.
- **Kubernetes** → orchestrate pods (schedule, self-heal, autoscale) across a cluster.
- **IaC** → declarative (Terraform), idempotent desired-state; protect state.
- **Secrets** → never commit (git history is forever); secrets manager + runtime injection + rotation.
- **SLA/SLO/error budget** → measurable data-reliability commitments.
- **Data contracts** → producer↔consumer agreement, enforced in CI → shift quality left.
- **Promoting data is hard** → stateful → idempotency + migrations + time-travel rollback.

## Mock interview (answer out loud, 60–90s each)

1. Why is Git essential for data engineers, and what are its areas?
2. merge vs rebase — and when never to rebase?
3. What is CI/CD for data, and how does it differ from app CI/CD?
4. What problem do containers solve, and image vs container?
5. What does Kubernetes add over Docker for data workloads?
6. What is Infrastructure as Code, and declarative vs imperative?
7. How should secrets be managed — and why is a secret in git history dangerous?
8. What is a data SLA/SLO and an error budget?
9. What is a data contract, and how is it enforced?
10. Why is promoting a data pipeline change harder than app code?

These cover the bulk of DataOps/platform-engineering rounds at Amazon, Google, Meta, and infra-heavy teams.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
