#!/usr/bin/env python3
"""
Script de diagnostic complet du flux de création de cours
"""

import requests
import json
import time
from datetime import datetime

API_URL = "https://claudyne.com/api"
ADMIN_KEY = "claudyne-admin-2024"

def print_separator():
    print("=" * 60)

def print_section(title):
    print(f"\n{title}")
    print("-" * 60)

# Étape 1: Générer token
print_separator()
print("🔍 DIAGNOSTIC COMPLET - Flux de création de cours")
print_separator()

print_section("📝 Étape 1: Génération du token admin")
token_response = requests.post(
    f"{API_URL}/admin/generate-token",
    json={"adminKey": ADMIN_KEY}
)
token_data = token_response.json()
print(f"Status: {token_response.status_code}")
print(f"Réponse: {json.dumps(token_data, indent=2)}")

if not token_data.get('success'):
    print("❌ Échec génération token")
    exit(1)

token = token_data['token']
print(f"✅ Token: {token[:30]}...")

# Étape 2: Créer un cours
print_section("📝 Étape 2: Création d'un cours de test")
timestamp = int(time.time())
course_data = {
    "title": f"Test Math Diagnostic {timestamp}",
    "subject": "mathematiques",
    "level": "6eme",
    "description": "Cours de test automatique",
    "content": "Contenu du cours de test",
    "duration": 45
}

print(f"📤 Payload:\n{json.dumps(course_data, indent=2)}")

create_response = requests.post(
    f"{API_URL}/admin/courses",
    json=course_data,
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\n📥 Réponse POST /api/admin/courses (Status {create_response.status_code}):")
create_data = create_response.json()
print(json.dumps(create_data, indent=2))

if not create_data.get('success'):
    print(f"❌ Échec création: {create_data.get('message')}")
    exit(1)

course_id = create_data['data']['course']['id']
print(f"✅ Cours créé avec ID: {course_id}")

# Étape 3: Vérifier /admin/content
print_section("📝 Étape 3: GET /api/admin/content")
admin_content = requests.get(
    f"{API_URL}/admin/content",
    headers={"Authorization": f"Bearer {token}"}
).json()

print(f"✅ Success: {admin_content.get('success')}")
print(f"📊 Stats: {json.dumps(admin_content.get('data', {}).get('stats', {}), indent=2)}")

# Étape 4: Vérifier /admin/content/courses
print_section("📝 Étape 4: GET /api/admin/content/courses")
admin_courses = requests.get(
    f"{API_URL}/admin/content/courses",
    headers={"Authorization": f"Bearer {token}"}
).json()

print(f"✅ Success: {admin_courses.get('success')}")
courses_list = admin_courses.get('data', {}).get('courses', [])
print(f"📊 Nombre de cours: {len(courses_list)}")

if len(courses_list) == 0:
    print("⚠️  AUCUN COURS retourné par /admin/content/courses")
else:
    print(f"📚 Premiers cours:")
    for i, course in enumerate(courses_list[:3]):
        print(f"  {i+1}. {course.get('title')} (ID: {course.get('id')}, Subject: {course.get('subject')}, Level: {course.get('level')})")

# Chercher notre cours
found = False
for course in courses_list:
    if course.get('id') == course_id:
        found = True
        print(f"\n✅ Notre cours TROUVÉ dans /admin/content/courses:")
        print(json.dumps(course, indent=2))
        break

if not found:
    print(f"\n❌ Notre cours (ID: {course_id}) N'EST PAS dans /admin/content/courses")

# Étape 5: Vérifier /public/content
print_section("📝 Étape 5: GET /api/public/content (PUBLIC - sans token)")
public_content = requests.get(f"{API_URL}/public/content").json()

print(f"✅ Success: {public_content.get('success')}")
public_courses = public_content.get('data', {}).get('courses', [])
print(f"📊 Nombre de cours publics: {len(public_courses)}")

if len(public_courses) == 0:
    print("⚠️  AUCUN COURS PUBLIC")
else:
    print(f"📚 Premiers cours publics:")
    for i, course in enumerate(public_courses[:5]):
        print(f"  {i+1}. {course.get('title')} (Subject: {course.get('subject')}, Level: {course.get('level')})")

# Chercher notre cours
public_found = False
for course in public_courses:
    if f"Test Math Diagnostic {timestamp}" in course.get('title', ''):
        public_found = True
        print(f"\n✅ Notre cours TROUVÉ dans /public/content:")
        print(json.dumps(course, indent=2))
        break

if not public_found:
    print(f"\n❌ Notre cours N'EST PAS dans /public/content")

# RÉSUMÉ
print_separator()
print("📊 RÉSUMÉ DU DIAGNOSTIC")
print_separator()
print(f"✅ Token admin: OK")
print(f"✅ POST /admin/courses: {create_response.status_code} - {create_data.get('success')}")
print(f"📊 Cours dans /admin/content/courses: {'TROUVÉ' if found else 'INTROUVABLE'}")
print(f"📊 Cours dans /public/content: {'TROUVÉ' if public_found else 'INTROUVABLE'}")
print()

if not found:
    print("🔴 PROBLÈME CRITIQUE: Le cours n'est pas persisté en DB")
    print("   → Vérifier: Subject existence, contraintes DB, logs INSERT")
elif not public_found:
    print("🟡 PROBLÈME FILTRE: Le cours est dans /admin mais pas /public")
    print("   → Vérifier: reviewStatus='approved', isActive=true")
else:
    print("🟢 SUCCÈS: Le cours est accessible partout!")

print_separator()
