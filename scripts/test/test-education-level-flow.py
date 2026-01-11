#!/usr/bin/env python3
"""
Test complet du flux educationLevel:
1. Créer un compte avec niveau 6EME
2. Vérifier le profil retourné
3. Vérifier les subjects filtrés par niveau
4. Changer le niveau vers 5EME
5. Vérifier que les subjects changent
"""
import requests
import json
import time

API_URL = "https://claudyne.com/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def test_registration():
    """Test 1: Créer un compte avec niveau 6EME"""
    print_section("TEST 1: Inscription avec niveau 6EME")

    timestamp = int(time.time())
    email = f"test-level-{timestamp}@claudyne.com"

    response = requests.post(
        f"{API_URL}/auth/register",
        json={
            "accountType": "STUDENT",
            "email": email,
            "password": "Test1234!",
            "firstName": "Test",
            "lastName": "Level",
            "phone": f"+237670{timestamp % 1000000}",
            "educationLevel": "6EME",
            "acceptTerms": True
        }
    )

    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Success: {data.get('success')}")

    if not data.get('success'):
        print(f"❌ Erreur: {data.get('message')}")
        return None, None

    token = data.get('data', {}).get('tokens', {}).get('accessToken')
    user_id = data.get('data', {}).get('user', {}).get('id')

    print(f"✅ Compte créé: {email}")
    print(f"   User ID: {user_id}")
    print(f"   Token: {token[:30]}...")

    return token, email

def test_profile(token):
    """Test 2: Vérifier le profil"""
    print_section("TEST 2: Récupération du profil")

    response = requests.get(
        f"{API_URL}/students/profile",
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"Status: {response.status_code}")
    data = response.json()

    if not data.get('success'):
        print(f"❌ Erreur: {data.get('message')}")
        print(f"Réponse complète: {json.dumps(data, indent=2)}")
        return None

    # La réponse est directement dans 'data', pas dans 'data.profile'
    profile = data.get('data', {})
    education_level = profile.get('educationLevel')

    print(f"✅ Profil récupéré:")
    print(f"   Nom: {profile.get('firstName')} {profile.get('lastName')}")
    print(f"   Education Level: {education_level}")
    print(f"   Student ID: {profile.get('studentId')}")

    if education_level != "6EME":
        print(f"⚠️  ATTENTION: Niveau attendu '6EME', reçu '{education_level}'")
    else:
        print(f"✅ Niveau correct: 6EME")

    return profile.get('studentId')

def test_subjects(token, expected_level_display):
    """Test 3: Vérifier les subjects filtrés"""
    print_section(f"TEST 3: Subjects pour niveau {expected_level_display}")

    response = requests.get(
        f"{API_URL}/students/subjects",
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"Status: {response.status_code}")
    data = response.json()

    if not data.get('success'):
        print(f"❌ Erreur: {data.get('message')}")
        return []

    subjects = data.get('data', {}).get('subjects', [])

    print(f"✅ {len(subjects)} subjects retournés")

    if len(subjects) == 0:
        print(f"⚠️  AUCUN SUBJECT! Vérifier:")
        print(f"   1. Des subjects existent avec level='{expected_level_display}'")
        print(f"   2. Les lessons ont reviewStatus='approved'")
        print(f"   3. Les subjects sont isActive=true")
    else:
        print(f"\n📚 Subjects trouvés:")
        for i, subject in enumerate(subjects[:5]):
            print(f"   {i+1}. {subject.get('title')} ({subject.get('category')})")
            print(f"      Progress: {subject.get('progress')}% | Lessons: {subject.get('totalLessons')}")

    return subjects

def test_update_level(token, new_level):
    """Test 4: Changer le niveau"""
    print_section(f"TEST 4: Mise à jour du niveau vers {new_level}")

    response = requests.put(
        f"{API_URL}/students/settings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "education": {
                "educationLevel": new_level
            }
        }
    )

    print(f"Status: {response.status_code}")
    data = response.json()

    if not data.get('success'):
        print(f"❌ Erreur: {data.get('message')}")
        return False

    print(f"✅ Mise à jour effectuée (status: {response.status_code})")
    print(f"   Note: Le endpoint ne retourne pas le educationLevel mis à jour")
    print(f"   On vérifiera via GET /profile dans le prochain test")

    return True

def main():
    print("\n🧪 TEST COMPLET DU SYSTÈME EDUCATION LEVEL")
    print("="*60)

    # Test 1: Inscription
    token, email = test_registration()
    if not token:
        print("\n❌ ÉCHEC: Impossible de créer le compte")
        return

    # Pause pour laisser la DB se synchroniser
    time.sleep(1)

    # Test 2: Profil
    student_id = test_profile(token)
    if not student_id:
        print("\n❌ ÉCHEC: Impossible de récupérer le profil")
        return

    # Test 3: Subjects niveau 6EME
    subjects_6eme = test_subjects(token, "6ème")

    # Pause
    time.sleep(1)

    # Test 4: Changer vers 5EME
    if test_update_level(token, "5EME"):
        # Pause
        time.sleep(1)

        # Test 5: Vérifier nouveau profil
        print_section("TEST 5: Vérification après mise à jour")
        student_id = test_profile(token)

        # Test 6: Nouveaux subjects
        subjects_5eme = test_subjects(token, "5ème")

        # Comparaison
        print_section("COMPARAISON")
        print(f"Subjects 6EME: {len(subjects_6eme)}")
        print(f"Subjects 5EME: {len(subjects_5eme)}")

        if len(subjects_6eme) == len(subjects_5eme):
            print("\n⚠️  ATTENTION: Même nombre de subjects!")
            print("   → Les subjects ne sont peut-être pas filtrés par niveau")
            print("   → OU il y a le même nombre de subjects 6ème et 5ème")
        else:
            print("\n✅ Nombre de subjects différent = Filtrage fonctionne!")

    # Résumé final
    print_section("RÉSUMÉ")
    print(f"Email créé: {email}")
    print(f"Token: {token[:30]}...")
    print("\n✅ Pour tester manuellement:")
    print(f"   1. Connexion: POST {API_URL}/auth/login")
    print(f"      Email: {email}")
    print(f"      Password: Test1234!")
    print(f"\n   2. Profil: GET {API_URL}/students/profile")
    print(f"      Authorization: Bearer {token[:30]}...")
    print(f"\n   3. Subjects: GET {API_URL}/students/subjects")
    print("\n🔍 Pour vérifier les logs serveur:")
    print("   ssh root@89.117.58.53 'cd /opt/claudyne/backend && tail -100 logs/app.log | grep 📚'")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
