#!/bin/bash

echo "Deploying updated Firestore rules for Google login fix..."
echo

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "ERROR: Firebase CLI is not installed"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "ERROR: Not logged in to Firebase"
    echo "Please run: firebase login"
    exit 1
fi

echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo
    echo "✅ SUCCESS: Firestore rules deployed successfully!"
    echo
    echo "Google login users can now:"
    echo "- Edit and save their profiles"
    echo "- Gain XP when completing services"
    echo "- Level up automatically"
    echo
else
    echo
    echo "❌ ERROR: Failed to deploy Firestore rules"
    echo "Please check your Firebase project configuration"
    echo
fi
