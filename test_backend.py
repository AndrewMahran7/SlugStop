#!/usr/bin/env python3
"""
Test script for the ride-tracking backend
"""
import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_backend():
    print("Testing Ride-Tracking Backend...")
    
    # Test health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test starting a driver
    print("\n2. Testing driver start...")
    driver_data = {
        "name": "John Doe",
        "lat": 37.7749,
        "lon": -122.4194
    }
    
    try:
        response = requests.post(f"{BASE_URL}/driver/start", json=driver_data)
        result = response.json()
        print(f"Driver start: {response.status_code} - {result}")
        driver_id = result.get('driver_id')
    except Exception as e:
        print(f"Driver start failed: {e}")
        return
    
    # Test adding another driver
    print("\n3. Testing second driver...")
    driver_data2 = {
        "name": "Jane Smith",
        "lat": 37.7849,
        "lon": -122.4094
    }
    
    try:
        response = requests.post(f"{BASE_URL}/driver/start", json=driver_data2)
        result = response.json()
        print(f"Second driver: {response.status_code} - {result}")
        driver_id2 = result.get('driver_id')
    except Exception as e:
        print(f"Second driver failed: {e}")
        return
    
    # Test get all drivers
    print("\n4. Testing get all drivers...")
    try:
        response = requests.get(f"{BASE_URL}/drivers")
        print(f"All drivers: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Get drivers failed: {e}")
    
    # Test rider finding nearby drivers
    print("\n5. Testing rider search...")
    rider_params = {
        "lat": 37.7750,
        "lon": -122.4180
    }
    
    try:
        response = requests.get(f"{BASE_URL}/rider", params=rider_params)
        print(f"Rider search: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Rider search failed: {e}")
    
    # Test stopping a driver
    print("\n6. Testing driver stop...")
    try:
        stop_data = {"driver_id": driver_id}
        response = requests.post(f"{BASE_URL}/driver/stop", json=stop_data)
        print(f"Driver stop: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Driver stop failed: {e}")
    
    # Test get all drivers again
    print("\n7. Testing get all drivers after stop...")
    try:
        response = requests.get(f"{BASE_URL}/drivers")
        print(f"All drivers after stop: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Get drivers failed: {e}")

if __name__ == "__main__":
    test_backend()
