// CORRECTIF LOGIN INCOGNITO - À intégrer dans index.html ligne ~3745

// Dans le .then(data => { ... }) du fetch login, remplacer par:
.then(data => {
    console.log('Login response:', data); // DEBUG

    if (data.success) {
        // Stockage des tokens - adapter à la structure de réponse du backend
        const tokens = data.tokens || data.data?.tokens || {};
        const user = data.user || data.data?.user || {};
        const family = data.family || data.data?.family || {};

        console.log('User data:', user); // DEBUG
        console.log('Tokens:', tokens); // DEBUG

        // Fonction sécurisée pour localStorage (gère incognito)
        const safeSetItem = (key, value) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn(`localStorage.setItem failed for ${key}:`, e);
                // En mode incognito, utiliser sessionStorage comme fallback
                try {
                    sessionStorage.setItem(key, value);
                    return true;
                } catch (e2) {
                    console.error('sessionStorage also failed:', e2);
                    return false;
                }
            }
        };

        // Stocker les tokens de manière sécurisée
        if (data.token) {
            // Structure simple du backend mobile
            safeSetItem('claudyne_token', data.token);
            safeSetItem('claudyne_user', JSON.stringify(user));
        } else if (tokens.accessToken) {
            // Structure complète
            safeSetItem('claudyne_token', tokens.accessToken);
            safeSetItem('claudyne_refresh_token', tokens.refreshToken);
            safeSetItem('claudyne_user', JSON.stringify(user));
            safeSetItem('claudyne_family', JSON.stringify(family));
        }

        // Redirection selon le type de compte utilisateur
        const userType = user.userType;
        const role = user.role;

        console.log('User type:', userType, 'Role:', role); // DEBUG

        // Vérifier que user a des propriétés avant de rediriger
        if (!userType && !role) {
            console.error('User type and role are undefined!');
            alert('Erreur: données utilisateur incomplètes');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Redirection sécurisée avec vérification
        let redirectUrl = '/parent'; // Par défaut

        if (role === 'ADMIN') {
            redirectUrl = '/admin-secure-k7m9x4n2p8w5z1c6';
        } else if (userType === 'MANAGER' || role === 'PARENT') {
            redirectUrl = '/parent';
        } else if (role === 'STUDENT') {
            redirectUrl = '/student';
        } else if (role === 'TEACHER') {
            redirectUrl = '/teacher';
        }

        console.log('Redirecting to:', redirectUrl); // DEBUG

        // Force la redirection
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 100);
    } else {
        // Affichage de l'erreur
        console.error('Login failed:', data.message);
        alert(data.message || 'Identifiants invalides');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
})
