.PHONY: setup test run run-nodbt dbt clean
SPARK_LOCAL_IP ?= 127.0.0.1
export SPARK_LOCAL_IP

setup:        ## install dependencies
	pip install -r requirements.txt

test:         ## unit + data-quality tests
	pytest -q

run:          ## full pipeline (PySpark + streaming + contracts + warehouse + dbt)
	python run.py

run-nodbt:    ## pipeline without dbt (no dbt install needed)
	python run.py --no-dbt

dbt:          ## build gold marts + tests only
	dbt build --project-dir dbt_bank --profiles-dir dbt_bank

clean:        ## remove generated outputs
	rm -rf out dbt_bank/target
