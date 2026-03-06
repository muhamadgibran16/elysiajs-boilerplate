import { AuthRepository } from './auth.repository';

export class AuthService {
    constructor(private authRepository: AuthRepository) { }

    async register(body: any) {
        const { email, password, name } = body;

        const existingUser = await this.authRepository.findByEmail(email);
        if (existingUser) {
            return { error: 'EMAIL_ALREADY_EXISTS', user: null };
        }

        // Hash password using Bun's native API (Argon2 instance in Bun > 1.0.21)
        const hashedPassword = await Bun.password.hash(password);

        const newUser = await this.authRepository.createUser({
            email,
            password: hashedPassword,
            name,
        });

        return { error: null, user: newUser };
    }

    async login(body: any) {
        const { email, password } = body;

        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            return { error: 'INVALID_CREDENTIALS', user: null };
        }

        // Verify password with Bun's native API
        const isPasswordValid = await Bun.password.verify(password, user.password);
        if (!isPasswordValid) {
            return { error: 'INVALID_CREDENTIALS', user: null };
        }

        return { error: null, user };
    }
}
