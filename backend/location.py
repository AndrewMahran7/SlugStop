from flask import Flask, blueprints


def get_location():
    return {"lat": 0.0, "lon": 0.0}