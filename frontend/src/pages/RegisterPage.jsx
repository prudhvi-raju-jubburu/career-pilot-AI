import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Compass, AlertCircle, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AuthTemplate from '../templates/AuthTemplate';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!', 'Welcome to CareerPilot');
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate
      title="Create Student Account"
      subtitle="Unlock personalized internship discovery and deterministic eligibility checks."
      badgeText="Mission Control Onboarding"
    >

        {/* Auth Card */}
        <Card variant="raised" style={{ padding: '2rem' }}>
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84375rem',
                marginBottom: '1.25rem',
              }}
              role="alert"
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={<User size={16} />}
              required
              autoComplete="name"
              disabled={loading}
            />

            <Input
              label="University Email"
              type="email"
              placeholder="alex@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
              disabled={loading}
              helper="We use your university email to identify college-specific opportunities."
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
              disabled={loading}
              helper="Must be at least 6 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
              iconRight={<UserPlus size={16} />}
            >
              Create Account
            </Button>
          </form>
        </Card>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
    </AuthTemplate>
  );
}
