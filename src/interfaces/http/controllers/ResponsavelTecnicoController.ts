import type { Container } from "../../../container.js";
import type { ResponsavelTecnico } from "../../../domain/responsavel-tecnico/ResponsavelTecnico.js";

export function paraRespostaResponsavelTecnico(rt: ResponsavelTecnico) {
  return {
    id: rt.id,
    nome: rt.nome,
    registroNumero: rt.registroProfissional.numero,
    registroOrgao: rt.registroProfissional.orgaoEmissor,
    especialidade: rt.especialidade ?? null,
    createdAt: rt.createdAt.toISOString(),
    updatedAt: rt.updatedAt.toISOString(),
  };
}

export const ResponsavelTecnicoController = {
  async cadastrar(
    container: Container,
    body: { nome: string; registroNumero: string; registroOrgao: string; especialidade?: string },
  ) {
    const { responsavelTecnico } = await container.useCases.cadastrarResponsavelTecnico.executar(body);
    return paraRespostaResponsavelTecnico(responsavelTecnico);
  },

  async listar(container: Container) {
    const { dados } = await container.useCases.listarResponsaveisTecnicos.executar();
    return { data: dados.map(paraRespostaResponsavelTecnico) };
  },

  async buscarPorId(container: Container, responsavelTecnicoId: string) {
    const { responsavelTecnico } = await container.useCases.buscarResponsavelTecnicoPorId.executar({
      responsavelTecnicoId,
    });
    return paraRespostaResponsavelTecnico(responsavelTecnico);
  },
};
