from flask import current_app
import psycopg2
from psycopg2 import Error
from app.config import Config

class DatabaseService:
    def __init__(self):
        self.host = Config.POSTGRES_HOST
        self.database = Config.POSTGRES_DB
        self.user = Config.POSTGRES_USER
        self.password = Config.POSTGRES_PASSWORD

    def create_connection(self):
        connection = None
        try:
            connection = psycopg2.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            print('Connection to PostgreSQL DB successful')
        except (Exception, Error) as error:
            print(f'The error {error} occurred')
        return connection

    def execute_query(self, query, params=None):
        connection = self.create_connection()
        try:
            cursor = connection.cursor()
            if params is None:
                cursor.execute(query)
            else:
                cursor.execute(query, params)
            connection.commit()
            result = cursor.fetchall()
            return result
        except (Exception, Error) as error:
            print(f'The error {error} occurred')
            connection.rollback()
        finally:
            if connection:
                cursor.close()
                connection.close()

    def create_table(self, query):
        self.execute_query(query)

    def insert_data(self, query, params):
        self.execute_query(query, params)

    def update_data(self, query, params):
        self.execute_query(query, params)

    def delete_data(self, query, params):
        self.execute_query(query, params)

    def get_data(self, query, params=None):
        return self.execute_query(query, params)
