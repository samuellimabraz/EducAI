"""Math Service for calculations and graph generation"""

import logging
from typing import Dict, Any, List, Optional
import sympy as sp
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

logger = logging.getLogger(__name__)


class MathService:
    """Service for mathematical operations"""

    def __init__(self):
        pass

    async def calculate(
        self, expression: str, show_steps: bool = True
    ) -> Dict[str, Any]:
        """
        Perform mathematical calculation

        Args:
            expression: Mathematical expression to evaluate
            show_steps: Whether to show solution steps

        Returns:
            Calculation result with optional steps
        """
        try:
            # Parse and evaluate expression
            expr = sp.sympify(expression)
            result = sp.simplify(expr)

            response = {
                "expression": str(expr),
                "result": str(result),
                "numeric_result": float(result.evalf()) if result.is_number else None,
            }

            if show_steps:
                # Generate solution steps (simplified version)
                steps = []
                steps.append({"step": "Expressão original", "value": str(expression)})
                steps.append({"step": "Resultado", "value": str(result)})
                response["steps"] = steps

            return response

        except Exception as e:
            logger.error(f"Calculation error: {str(e)}")
            raise ValueError(f"Erro ao calcular: {str(e)}")

    async def generate_graph(
        self,
        function: str,
        x_range: List[float] = None,
        y_range: List[float] = None,
        title: str = None,
    ) -> Dict[str, Any]:
        """
        Generate graph for mathematical function

        Args:
            function: Mathematical function to plot
            x_range: X-axis range [min, max]
            y_range: Y-axis range [min, max]
            title: Graph title

        Returns:
            Graph data as base64 image
        """
        try:
            if x_range is None:
                x_range = [-10, 10]

            # Parse function
            x = sp.Symbol("x")
            expr = sp.sympify(function)
            f = sp.lambdify(x, expr, "numpy")

            # Generate points
            x_values = np.linspace(x_range[0], x_range[1], 400)
            y_values = f(x_values)

            # Create plot
            plt.figure(figsize=(8, 6))
            plt.plot(x_values, y_values, "b-", linewidth=2)
            plt.grid(True, alpha=0.3)
            plt.xlabel("x")
            plt.ylabel("y")

            if title:
                plt.title(title)
            else:
                plt.title(f"Gráfico de y = {function}")

            if y_range:
                plt.ylim(y_range)

            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format="png", bbox_inches="tight")
            plt.close()

            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode("utf-8")

            return {
                "function": function,
                "image_base64": image_base64,
                "description": f"Gráfico da função y = {function}",
            }

        except Exception as e:
            logger.error(f"Graph generation error: {str(e)}")
            raise ValueError(f"Erro ao gerar gráfico: {str(e)}")
