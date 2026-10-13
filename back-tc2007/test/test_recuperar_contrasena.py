import os
import pytest
import requests

API_URL = os.getenv(
    "API_URL",
    "http://localhost:3000"
)

# Endpoint para recuperar contraseña
ENDPOINT = f"{API_URL}/auth/forgot-password"

def test_recuperar_contrasena_correo_registrado():
    # Obtener el correo de un usuario que exista en la base de datos
    correo = os.getenv("TEST_REGISTERED_EMAIL")
    if not correo:
        pytest.skip(
            "Configura TEST_REGISTERED_EMAIL con un correo registrado."
        )
    datos = {
        "correo": correo
    }
    respuesta = requests.post(
        ENDPOINT,
        json=datos,
        timeout=10
    )
    assert respuesta.status_code == 200
    assert respuesta.json() == {
        "message": "Se generó el código de recuperación"
    }

def test_recuperar_contrasena_correo_inexistente():
    # Correo que no debe existir en la base de datos
    datos = {
        "correo": "usuario-inexistente-prueba@example.com"
    }
    respuesta = requests.post(
        ENDPOINT,
        json=datos,
        timeout=10
    )
    assert respuesta.status_code == 401
    assert respuesta.json()["message"] == "El usuario no existe"