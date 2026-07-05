import psycopg2
from psycopg2 import Error
from flask import current_app
from app.utils.helpers import get_config


class Database:
    def __init__(self):
        self.config = get_config()
        self.host = self.config['host']
        self.database = self.config['database']
        self.user = self.config['user']
        self.password = self.config['password']

    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            self.cursor = self.connection.cursor()
            return self.connection
        except (Exception, Error) as error:
            print("Error while connecting to PostgreSQL", error)

    def execute_query(self, query, params=None):
        try:
            self.cursor.execute(query, params)
            self.connection.commit()
            return self.cursor.fetchall()
        except (Exception, Error) as error:
            print("Error while executing query", error)
            self.connection.rollback()

    def close_connection(self):
        if self.connection:
            self.cursor.close()
            self.connection.close()
            print("PostgreSQL connection is closed")
