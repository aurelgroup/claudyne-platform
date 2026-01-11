#!/usr/bin/env python3
"""
Script pour vérifier les niveaux des subjects et le mapping
"""
import requests
import json

API_URL = "https://claudyne.com/api"
ADMIN_KEY = "claudyne-admin-2024"

print("🔍 Génération du token admin...\n")

# Get token
token_response = requests.post(
    f"{API_URL}/admin/generate-token",
    json={"adminKey": ADMIN_KEY}
)
token_data = token_response.json()

if not token_data.get('success'):
    print("❌ Échec génération token")
    exit(1)

token = token_data['token']
print(f"✅ Token obtenu\n")

# Get admin content
print("📚 Récupération des subjects...\n")
admin_content = requests.get(
    f"{API_URL}/admin/content",
    headers={"Authorization": f"Bearer {token}"}
).json()

if not admin_content.get('success'):
    print(f"❌ Erreur: {admin_content.get('message')}")
    exit(1)

subjects = admin_content.get('data', {}).get('subjects', [])

print(f"Total: {len(subjects)} subjects\n")

# Group by level
by_level = {}
for subject in subjects:
    level = subject.get('level', 'N/A')
    if level not in by_level:
        by_level[level] = []
    by_level[level].append(subject)

# Display by level
print("📊 SUBJECTS PAR NIVEAU:\n")
for level in sorted(by_level.keys()):
    subjects_for_level = by_level[level]
    active = len([s for s in subjects_for_level if s.get('isActive')])
    total = len(subjects_for_level)
    print(f"Niveau: {level} ({active}/{total} actifs)")
    for s in subjects_for_level:
        status = "✅" if s.get('isActive') else "❌"
        print(f"  {status} {s.get('title')} ({s.get('category')})")
    print()

# Check mapping
print("\n🔄 MAPPING NIVEAU ÉTUDIANT → NIVEAU SUBJECT:\n")
LEVEL_MAPPING = {
    'MATERNELLE_PETITE': 'Maternelle',
    'MATERNELLE_MOYENNE': 'Maternelle',
    'MATERNELLE_GRANDE': 'Maternelle',
    'SIL': 'SIL',
    'CP': 'CP',
    'CE1': 'CE1',
    'CE2': 'CE2',
    'CM1': 'CM1',
    'CM2': 'CM2',
    '6EME': '6ème',
    '5EME': '5ème',
    '4EME': '4ème',
    '3EME': '3ème',
    'SECONDE': '2nde',
    'PREMIERE': '1ère',
    'TERMINALE': 'Tle'
}

# Test key mappings
test_levels = ['6EME', 'TERMINALE', 'CP', 'CM2', 'SECONDE']
for student_level in test_levels:
    subject_level = LEVEL_MAPPING.get(student_level, student_level)
    subjects_for_level = by_level.get(subject_level, [])
    active_count = len([s for s in subjects_for_level if s.get('isActive')])
    print(f"  {student_level} → {subject_level}: {active_count} subjects actifs")

print("\n✅ Diagnostic terminé")
