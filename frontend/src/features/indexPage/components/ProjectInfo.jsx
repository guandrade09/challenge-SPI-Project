    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
    import { Users, Building2, Calendar, Target } from "lucide-react";
    import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";

    export function ProjectInfo({ data }) {
    return (
        <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações do Projeto
            </CardTitle>
            <CardDescription>Detalhes do projeto de monitoramento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nome do Projeto</p>
                <p className="font-medium">SafetyVision - EPI Monitor</p>
                </div>
                <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="font-medium">Produção Industrial</p>
                </div>
                <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data de Início
                </p>
                <p className="font-medium">01 de Janeiro, 2026</p>
                </div>
                <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Objetivo
                </p>
                <p className="font-medium">99% de conformidade</p>
                </div>
            </div>

            <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">EPI's Monitorados</h4>
                <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Capacete</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Óculos</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Colete</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Luvas</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Botas</span>
                </div>
            </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe do Projeto
            </CardTitle>
            <CardDescription>Membros responsáveis pelo monitoramento</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
                {data.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                    <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                        {member.initials}
                    </AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                </div>
                ))}
            </div>
            </CardContent>
        </Card>
        </div>
    );
    }

    export default ProjectInfo;