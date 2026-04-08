CREATE DATABASE IF NOT EXISTS `sistema_gestao` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistema_gestao`;

-- ==============================================================================
-- 1. TABELAS INDEPENDENTES (Sem Foreign Keys)
-- ==============================================================================

CREATE TABLE `fornecedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcentagem` decimal(5,2) NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_usuario` enum('admin','motorista','financeiro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'motorista',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `veiculos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ano` int NOT NULL,
  `km` int NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `atualizado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `veiculo` enum('Master','Strada','Fiorino') COLLATE utf8mb4_unicode_ci NOT NULL,
  `oleo` enum('Baixo','Médio','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `agua` enum('Baixo','Médio','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `freio` enum('Baixo','Médio','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `direcao` enum('Baixo','Médio','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `combustivel` enum('Reserva','Abaixo de meio tanque','Meio tanque','Acima de meio tanque','Completo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pneu_calibragem` enum('Baixo','Médio','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pneu_estado` enum('Desgastado','Meia vida','Apto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `luzes` enum('Defeito pisca','Defeito lanterna','Defeito farol','Todos Aptos') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruidos` enum('Sem ruídos anormais','Ruído motor','Ruído suspensão','Ruído portas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `lixo` enum('Pendente','Feito') COLLATE utf8mb4_unicode_ci NOT NULL,
  `responsavel` enum('Eliege','Mário','Mirna','Renilson') COLLATE utf8mb4_unicode_ci NOT NULL,
  `motorista` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `observacao` text COLLATE utf8mb4_unicode_ci,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `atualizado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `entregas_pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `data_pedido` date NOT NULL,
  `criado_por` varchar(100) NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notificacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mensagem` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('checklist','caixa') COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 2. TABELAS DEPENDENTES (Com Foreign Keys)
-- ==============================================================================

CREATE TABLE `caixas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preco_parda` decimal(10,2) NOT NULL,
  `preco_branca` decimal(10,2) NOT NULL,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `atualizado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fornecedor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_caixa_fornecedor` (`fornecedor_id`),
  CONSTRAINT `fk_caixa_fornecedor` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `veiculo_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `veiculo_id` int NOT NULL,
  `servico` text COLLATE utf8mb4_unicode_ci,
  `oficina` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mecanico` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_servico` date NOT NULL,
  `km_servico` int NOT NULL,
  `documento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `atualizado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_v_chk_veiculo` (`veiculo_id`),
  CONSTRAINT `fk_v_chk_veiculo` FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `entregas_clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `cliente_nome` varchar(150) NOT NULL,
  `status` enum('ENTREGUE','NAO_ENTREGUE','NA_ROTA') NOT NULL DEFAULT 'NA_ROTA',
  `observacao` text,
  `atualizado_por` varchar(100) NOT NULL,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pedido_entrega` (`pedido_id`),
  CONSTRAINT `fk_pedido_entrega` FOREIGN KEY (`pedido_id`) REFERENCES `entregas_pedidos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==============================================================================
-- 3. INSERTS (Somente Admins)
-- ==============================================================================

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `criado_em`, `tipo_usuario`) VALUES 
(1, 'David Silva', 'davidsilva@eco.com', '230497', '2025-09-09 14:54:20', 'admin'),