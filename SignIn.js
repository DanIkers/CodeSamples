import React from 'react'
import { useSignInWithGoogle } from 'react-firebase-hooks/auth'

export default function SignIn() {
  return (
    <div>
      <button onClick={useSignInWithGoogle}>Sign in with Google</button>
    </div>
  )
}
