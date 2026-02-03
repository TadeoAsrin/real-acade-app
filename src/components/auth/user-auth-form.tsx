"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: "login" | "register";
}

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).optional(),
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type UserFormValue = z.infer<typeof formSchema>;

export function UserAuthForm({ className, mode, ...props }: UserAuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: UserFormValue) => {
    setIsLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Inicio de sesión exitoso", description: "Bienvenido a Real Acade." });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        await updateProfile(user, {
          displayName: data.name,
        });

        await setDoc(doc(firestore, 'players', user.uid), {
          name: data.name || user.email?.split('@')[0],
          email: user.email,
          role: 'player'
        });

        toast({ title: "Registro exitoso", description: "Tu cuenta ha sido creada." });
      }
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {mode === "register" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" placeholder="Juan Pérez" type="text" disabled={isLoading} {...register("name")} />
              {errors?.name && <p className="px-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="nombre@ejemplo.com" type="email" disabled={isLoading} {...register("email")} />
            {errors?.email && <p className="px-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" placeholder="••••••••" type="password" disabled={isLoading} {...register("password")} />
            {errors?.password && <p className="px-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
