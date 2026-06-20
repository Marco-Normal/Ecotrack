from dataclasses import dataclass
from enum import enum
import uuid
from datetime import datetime
from decimal import Decimal


class Tipo(enum):
    ORGANICO = 1
    RECICLAVEL = 2
    TECNOLOGIA = 3


@dataclass
class Endereco:
    rua: str
    numero: int
    cep: str
    bairro: str


@dataclass
class Empresa:
    cnpj: str
    nome: str
    endereco: Endereco


@dataclass
class CentroReciclagem(Empresa):
    cnpj: str
    nome: str
    endereco: Endereco
    tipo: Tipo

    def __post_init__(self):
        super().__init__(self.cnpj, self.nome, self.endereco)


@dataclass
class CentroColeta(Empresa):
    cnpj: str
    nome: str
    endereco: Endereco

    def __post_init__(self):
        super().__init__(self.cnpj, self.nome, self.endereco)


@dataclass
class Estoque:
    cnpj: str
    tipo: str
    valor: Decimal
    quantidade: int


@dataclass
class Recompensa:
    id: uuid
    cpf: str
    cnpj: str
    tipo: str
    dataHora: datetime


@dataclass
class Pessoa:
    cpf: str
    nome: str
    creditos: int


@dataclass
class Lote:
    nroSerie: uuid
    codEnvio: uuid
    tipo: str


@dataclass
class Transporte:
    codEnvio: uuid
    destinatario: str
    remetente: str


@dataclass
class DentroLote:
    produto: uuid
    nroSerie: uuid
    codEnvio: uuid


@dataclass
class Produto:
    nroControle: uuid
    centroColeta: str
    dataHora: datetime
    tipo: Tipo
    pessoa: str
    qtd: int
